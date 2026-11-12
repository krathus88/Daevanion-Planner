// Package wire turns the bytes the AION 2 server sends into game messages.
//
// Every frame is a varint V followed by V-4 body bytes. A body that starts
// with FF FF (or one flag byte F0..FE, then FF FF) is a bundle: a u32 size and
// a raw LZ4 block holding more frames. Any other body is one message: two type
// bytes, then its fields. Zero bytes between frames are padding.
package wire

import (
	"bytes"
	"encoding/binary"
	"fmt"
)

const (
	maxFrame     = 4 << 20
	maxUnpacked  = 16 << 20
	maxDepth     = 3
	maxUnsynced  = 1 << 20
	syncFrames   = 6
	headerLength = 5
)

// The server tick (00 36, 10-byte body) comes every 50 ms: a safe place to
// pick up the stream when joining it midway.
var tickFrame = []byte{0x0e, 0x00, 0x36}

// Message is one game message: its two type bytes in wire order and the rest.
type Message struct {
	Op   [2]byte
	Body []byte
}

// Type is the message type as the hex of its wire bytes, e.g. "0036".
func (m Message) Type() string {
	return fmt.Sprintf("%02x%02x", m.Op[0], m.Op[1])
}

// Decoder splits one direction of one TCP connection into messages.
type Decoder struct {
	buf    []byte
	synced bool
	// Bundles that failed to unpack, for the status line.
	BadBundles int
}

// NewDecoder starts at the beginning of a connection.
func NewDecoder() *Decoder {
	return &Decoder{synced: true}
}

// NewDecoderMidway starts somewhere inside a connection.
func NewDecoderMidway() *Decoder {
	return &Decoder{}
}

// Lost drops what is buffered: bytes went missing, so the next ones can't
// follow on.
func (d *Decoder) Lost() {
	d.buf = d.buf[:0]
	d.synced = false
}

// Synced reports whether the decoder knows where frames start.
func (d *Decoder) Synced() bool {
	return d.synced
}

// Feed adds stream bytes and returns the messages they complete.
func (d *Decoder) Feed(data []byte) []Message {
	d.buf = append(d.buf, data...)

	var out []Message

	for {
		if !d.synced && !d.resync() {
			break
		}

		consumed, messages, ok := d.drain()
		out = append(out, messages...)
		d.buf = d.buf[consumed:]

		if ok {
			break
		}

		// A frame header made no sense: find the frames again.
		d.synced = false
	}

	// Keep the buffer from holding on to old bytes.
	if cap(d.buf) > 4*len(d.buf)+(64<<10) {
		d.buf = append([]byte(nil), d.buf...)
	}

	return out
}

// drain reads every complete frame. ok is false when a header was invalid.
func (d *Decoder) drain() (consumed int, out []Message, ok bool) {
	i := 0

	for i < len(d.buf) {
		if d.buf[i] == 0 {
			i++
			continue
		}

		body, next, status := readFrame(d.buf, i)
		if status == frameIncomplete {
			break
		}
		if status == frameInvalid {
			return i, out, false
		}

		out = d.handleBody(out, body, 0)
		i = next
	}

	return i, out, true
}

// resync looks for a tick frame followed by enough valid frames.
func (d *Decoder) resync() bool {
	from := 0

	for {
		at := bytes.Index(d.buf[from:], tickFrame)
		if at < 0 {
			break
		}
		at += from

		switch checkChain(d.buf, at) {
		case chainValid:
			d.buf = d.buf[at:]
			d.synced = true
			return true
		case chainShort:
			// Wait for more bytes before judging this spot.
			d.buf = d.buf[at:]
			return false
		}

		from = at + 1
	}

	// No tick in sight; keep only a tail that could start one.
	if len(d.buf) > maxUnsynced {
		d.buf = append([]byte(nil), d.buf[len(d.buf)-len(tickFrame):]...)
	}

	return false
}

type chainResult int

const (
	chainValid chainResult = iota
	chainShort
	chainInvalid
)

func checkChain(buf []byte, at int) chainResult {
	i := at

	for count := 0; count < syncFrames; count++ {
		for i < len(buf) && buf[i] == 0 {
			i++
		}
		_, next, status := readFrame(buf, i)
		switch status {
		case frameIncomplete:
			return chainShort
		case frameInvalid:
			return chainInvalid
		}
		i = next
	}

	return chainValid
}

type frameStatus int

const (
	frameComplete frameStatus = iota
	frameIncomplete
	frameInvalid
)

// readFrame reads the frame at buf[at]: its body and where the next one starts.
func readFrame(buf []byte, at int) ([]byte, int, frameStatus) {
	value, width := uvarint(buf[at:])
	if width == 0 {
		return nil, 0, frameIncomplete
	}
	if width < 0 || value < 6 || value-4 > maxFrame {
		return nil, 0, frameInvalid
	}

	start := at + width
	end := start + int(value) - 4
	if end > len(buf) {
		return nil, 0, frameIncomplete
	}

	return buf[start:end], end, frameComplete
}

// uvarint reads a minimal varint of at most 5 bytes. width is 0 when more
// bytes are needed and -1 when it isn't a valid length.
func uvarint(b []byte) (uint64, int) {
	var value uint64

	for k := 0; k < headerLength; k++ {
		if k >= len(b) {
			return 0, 0
		}
		c := b[k]
		value |= uint64(c&0x7f) << (7 * k)
		if c < 0x80 {
			if k > 0 && c == 0 {
				return 0, -1
			}
			return value, k + 1
		}
	}

	return 0, -1
}

func (d *Decoder) handleBody(out []Message, body []byte, depth int) []Message {
	if bundle := bundleData(body); bundle != nil {
		if depth >= maxDepth || len(bundle) < 4 {
			d.BadBundles++
			return out
		}

		size := int(binary.LittleEndian.Uint32(bundle))
		if size > maxUnpacked {
			d.BadBundles++
			return out
		}

		unpacked, err := decodeLZ4(bundle[4:], size)
		if err != nil {
			d.BadBundles++
			return out
		}

		i := 0
		for i < len(unpacked) {
			if unpacked[i] == 0 {
				i++
				continue
			}
			inner, next, status := readFrame(unpacked, i)
			if status != frameComplete {
				d.BadBundles++
				break
			}
			out = d.handleBody(out, inner, depth+1)
			i = next
		}

		return out
	}

	if len(body) < 2 {
		return out
	}

	return append(out, Message{
		Op:   [2]byte{body[0], body[1]},
		Body: append([]byte(nil), body[2:]...),
	})
}

// bundleData returns what follows a bundle's FF FF marker, or nil.
func bundleData(body []byte) []byte {
	if len(body) >= 2 && body[0] == 0xff && body[1] == 0xff {
		return body[2:]
	}
	if len(body) >= 3 && body[0] >= 0xf0 && body[0] <= 0xfe && body[1] == 0xff && body[2] == 0xff {
		return body[3:]
	}

	return nil
}
