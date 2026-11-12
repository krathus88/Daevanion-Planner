package netio

import (
	"bytes"
	"encoding/binary"
	"testing"
	"time"
)

var start = time.Unix(1_800_000_000, 0)

func joined(r Result) string {
	return string(bytes.Join(r.Data, nil))
}

func seg(seq uint32, data string) Segment {
	return Segment{Seq: seq, Payload: []byte(data)}
}

func TestInOrder(t *testing.T) {
	var a Assembler
	if got := joined(a.Add(seg(100, "abc"), start)); got != "abc" {
		t.Fatalf("got %q", got)
	}
	if got := joined(a.Add(seg(103, "de"), start)); got != "de" {
		t.Fatalf("got %q", got)
	}
}

func TestOutOfOrderWaits(t *testing.T) {
	var a Assembler
	a.Add(seg(100, "ab"), start)
	if got := joined(a.Add(seg(104, "ef"), start)); got != "" {
		t.Fatalf("released %q early", got)
	}
	if got := joined(a.Add(seg(102, "cd"), start)); got != "cdef" {
		t.Fatalf("got %q", got)
	}
}

func TestRetransmitsAndOverlap(t *testing.T) {
	var a Assembler
	a.Add(seg(100, "abcd"), start)
	if got := joined(a.Add(seg(100, "abcd"), start)); got != "" {
		t.Fatalf("repeated %q", got)
	}
	if got := joined(a.Add(seg(102, "cdef"), start)); got != "ef" {
		t.Fatalf("got %q", got)
	}
}

func TestGapTimesOut(t *testing.T) {
	var a Assembler
	a.Add(seg(100, "ab"), start)
	a.Add(seg(110, "xy"), start)
	r := a.Add(seg(112, "z"), start.Add(3*time.Second))
	if !r.Lost || joined(r) != "xyz" {
		t.Fatalf("lost %v, got %q", r.Lost, joined(r))
	}
}

func TestSequenceWraps(t *testing.T) {
	var a Assembler
	a.Add(seg(0xfffffffe, "ab"), start)
	if got := joined(a.Add(seg(0, "cd"), start)); got != "cd" {
		t.Fatalf("got %q", got)
	}
}

func TestSynRestarts(t *testing.T) {
	var a Assembler
	a.Add(seg(500, "old"), start)
	r := a.Add(Segment{Seq: 1000, SYN: true}, start)
	if !r.Started {
		t.Fatal("expected a start")
	}
	if got := joined(a.Add(seg(1001, "new"), start)); got != "new" {
		t.Fatalf("got %q", got)
	}
}

func ethernetFrame(payload []byte, seq uint32, flags byte) []byte {
	frame := make([]byte, 14)
	binary.BigEndian.PutUint16(frame[12:14], 0x0800)
	ip := make([]byte, 20)
	ip[0] = 0x45
	binary.BigEndian.PutUint16(ip[2:4], uint16(20+20+len(payload)))
	ip[9] = 6
	copy(ip[12:16], []byte{193, 202, 112, 94})
	copy(ip[16:20], []byte{192, 168, 0, 137})
	tcp := make([]byte, 20)
	binary.BigEndian.PutUint16(tcp[0:2], 13328)
	binary.BigEndian.PutUint16(tcp[2:4], 54088)
	binary.BigEndian.PutUint32(tcp[4:8], seq)
	tcp[12] = 5 << 4
	tcp[13] = flags
	frame = append(frame, ip...)
	frame = append(frame, tcp...)
	frame = append(frame, payload...)
	// Ethernet padding past the IP length.
	return append(frame, 0, 0, 0)
}

func TestParseSegment(t *testing.T) {
	s, ok := ParseSegment(LinkEthernet, ethernetFrame([]byte("hi"), 42, flagSYN))
	if !ok || s.Src.String() != "193.202.112.94:13328" || s.Dst.Port != 54088 || s.Seq != 42 || !s.SYN || string(s.Payload) != "hi" {
		t.Fatalf("got %+v ok %v", s, ok)
	}
}

func TestParseSegmentSkipsOtherProtocols(t *testing.T) {
	frame := ethernetFrame(nil, 1, 0)
	frame[14+9] = 17
	if _, ok := ParseSegment(LinkEthernet, frame); ok {
		t.Fatal("parsed UDP as TCP")
	}
}

func TestReadPcapng(t *testing.T) {
	le := binary.LittleEndian
	var file []byte
	block := func(kind uint32, body []byte) {
		for len(body)%4 != 0 {
			body = append(body, 0)
		}
		length := uint32(12 + len(body))
		file = le.AppendUint32(file, kind)
		file = le.AppendUint32(file, length)
		file = append(file, body...)
		file = le.AppendUint32(file, length)
	}
	section := le.AppendUint32(nil, byteOrderMagic)
	section = append(section, 1, 0, 0, 0)
	section = le.AppendUint64(section, ^uint64(0))
	block(blockSection, section)
	iface := le.AppendUint16(nil, LinkEthernet)
	iface = append(iface, 0, 0, 0, 0, 0, 0)
	block(blockInterface, iface)
	data := ethernetFrame([]byte("x"), 7, 0)
	stamp := uint64(1_700_000_000_500_000)
	packet := le.AppendUint32(nil, 0)
	packet = le.AppendUint32(packet, uint32(stamp>>32))
	packet = le.AppendUint32(packet, uint32(stamp))
	packet = le.AppendUint32(packet, uint32(len(data)))
	packet = le.AppendUint32(packet, uint32(len(data)))
	packet = append(packet, data...)
	block(blockEnhanced, packet)

	var got []Packet
	if err := ReadPcapng(bytes.NewReader(file), func(p Packet) { got = append(got, p) }); err != nil {
		t.Fatal(err)
	}
	if len(got) != 1 || got[0].Link != LinkEthernet || got[0].Time.Unix() != 1_700_000_000 || len(got[0].Data) != len(data) {
		t.Fatalf("got %+v", got)
	}
}
