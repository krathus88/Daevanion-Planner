package pipeline

import (
	"encoding/binary"
	"testing"
	"time"

	"daevanion-companion/internal/netio"
	"daevanion-companion/internal/state"
	"daevanion-companion/internal/wire"
)

// An Ethernet frame carrying one TCP segment from port `from`.
func packet(from uint16, seq uint32, syn bool, payload []byte) netio.Packet {
	frame := make([]byte, 14)
	binary.BigEndian.PutUint16(frame[12:14], 0x0800)
	ip := make([]byte, 20)
	ip[0] = 0x45
	binary.BigEndian.PutUint16(ip[2:4], uint16(40+len(payload)))
	ip[9] = 6
	copy(ip[12:16], []byte{193, 202, 112, 94})
	copy(ip[16:20], []byte{192, 168, 0, 2})
	tcp := make([]byte, 20)
	binary.BigEndian.PutUint16(tcp[0:2], from)
	binary.BigEndian.PutUint16(tcp[2:4], 50000)
	binary.BigEndian.PutUint32(tcp[4:8], seq)
	tcp[12] = 5 << 4
	if syn {
		tcp[13] = 0x02
	}
	frame = append(append(append(frame, ip...), tcp...), payload...)
	return netio.Packet{Time: time.Unix(1_800_000_000, 0), Link: netio.LinkEthernet, Data: frame}
}

// A server tick frame: varint 14, then 00 36 and 8 bytes.
var tick = []byte{0x0e, 0x00, 0x36, 1, 2, 3, 4, 5, 6, 7, 8}

func TestEveryMessageReachesOnMessage(t *testing.T) {
	p := New(state.NewTracker())
	var seen []string
	p.OnMessage = func(conn string, m wire.Message, at time.Time) {
		seen = append(seen, conn+" "+m.Type())
	}

	p.Packet(packet(GamePort, 100, true, nil))
	p.Packet(packet(GamePort, 101, false, append(append([]byte{}, tick...), tick...)))

	if len(seen) != 2 || seen[0] != "193.202.112.94:13328 > 192.168.0.2:50000 0036" || p.Messages != 2 {
		t.Fatalf("got %v (%d)", seen, p.Messages)
	}
}

func TestOtherPortsAreIgnored(t *testing.T) {
	p := New(state.NewTracker())
	p.Packet(packet(443, 100, true, nil))
	p.Packet(packet(443, 101, false, tick))
	if p.Messages != 0 {
		t.Fatalf("read %d messages from another port", p.Messages)
	}
}
