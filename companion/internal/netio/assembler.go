package netio

import "time"

const (
	// Out-of-order bytes kept while waiting for a missing segment.
	maxPending = 8 << 20
	// How long a gap may stay open before its bytes count as lost. Captures
	// sometimes miss a segment the game itself received.
	gapTimeout = 2 * time.Second
)

// Assembler puts one direction of one connection back in order.
type Assembler struct {
	next         uint32
	started      bool
	pending      map[uint32][]byte
	pendingBytes int
	gapSince     time.Time
}

// Result is what one segment released.
type Result struct {
	// In-order bytes, oldest first.
	Data [][]byte
	// Bytes before Data went missing for good.
	Lost bool
	// The connection (re)started with a SYN.
	Started bool
}

// before reports whether a comes before b, across the sequence wraparound.
func before(a, b uint32) bool {
	return int32(a-b) < 0
}

// Add takes one segment.
func (a *Assembler) Add(segment Segment, now time.Time) Result {
	var result Result

	if segment.SYN {
		a.reset(segment.Seq + 1)
		result.Started = true
		// A SYN with data is legal but unusual: fall through with seq+1.
		segment.Seq++
	}

	if len(segment.Payload) == 0 {
		return result
	}

	if !a.started {
		// Joined midway: take this as the start.
		a.reset(segment.Seq)
	}

	a.store(segment.Seq, segment.Payload)
	result.Data = a.release()

	if a.pendingBytes == 0 {
		a.gapSince = time.Time{}
		return result
	}

	if a.gapSince.IsZero() {
		a.gapSince = now
	}
	if now.Sub(a.gapSince) > gapTimeout || a.pendingBytes > maxPending {
		// Give up on the gap: skip to the earliest bytes we have.
		a.next = a.earliest()
		result.Lost = true
		result.Data = append(result.Data, a.release()...)
		a.gapSince = time.Time{}
		if a.pendingBytes > 0 {
			a.gapSince = now
		}
	}

	return result
}

func (a *Assembler) reset(next uint32) {
	a.next = next
	a.started = true
	a.pending = make(map[uint32][]byte)
	a.pendingBytes = 0
	a.gapSince = time.Time{}
}

func (a *Assembler) store(seq uint32, payload []byte) {
	end := seq + uint32(len(payload))

	// Already delivered.
	if !before(a.next, end) {
		return
	}
	// Partly delivered: keep the new part.
	if before(seq, a.next) {
		payload = payload[a.next-seq:]
		seq = a.next
	}

	if old, ok := a.pending[seq]; ok {
		if len(old) >= len(payload) {
			return
		}
		a.pendingBytes -= len(old)
	}

	a.pending[seq] = append([]byte(nil), payload...)
	a.pendingBytes += len(payload)
}

func (a *Assembler) release() [][]byte {
	var out [][]byte

	for {
		progressed := false

		for seq, data := range a.pending {
			end := seq + uint32(len(data))

			if !before(a.next, end) {
				// Entirely old.
				delete(a.pending, seq)
				a.pendingBytes -= len(data)
				progressed = true
				continue
			}
			if before(a.next, seq) {
				continue
			}

			// Starts at or before next: deliver the rest.
			delete(a.pending, seq)
			a.pendingBytes -= len(data)
			out = append(out, data[a.next-seq:])
			a.next = end
			progressed = true
		}

		if !progressed {
			return out
		}
	}
}

func (a *Assembler) earliest() uint32 {
	first := true
	var earliest uint32

	for seq := range a.pending {
		if first || before(seq, earliest) {
			earliest = seq
			first = false
		}
	}

	return earliest
}
