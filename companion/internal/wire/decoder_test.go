package wire

import (
	"bytes"
	"encoding/binary"
	"testing"
)

func varint(value int) []byte {
	var out []byte
	for value >= 0x80 {
		out = append(out, byte(value)|0x80)
		value >>= 7
	}
	return append(out, byte(value))
}

func frame(body []byte) []byte {
	return append(varint(len(body)+4), body...)
}

func tick(n byte) []byte {
	return frame([]byte{0x00, 0x36, n, 0, 0, 0, 0, 0, 0, 0})
}

// A literals-only LZ4 block.
func literalBlock(data []byte) []byte {
	if len(data) >= 15 {
		out := []byte{0xf0}
		rest := len(data) - 15
		for rest >= 255 {
			out = append(out, 255)
			rest -= 255
		}
		out = append(out, byte(rest))
		return append(out, data...)
	}
	return append([]byte{byte(len(data) << 4)}, data...)
}

func bundle(inner []byte) []byte {
	body := []byte{0xff, 0xff}
	body = binary.LittleEndian.AppendUint32(body, uint32(len(inner)))
	return frame(append(body, literalBlock(inner)...))
}

func types(messages []Message) []string {
	var out []string
	for _, m := range messages {
		out = append(out, m.Type())
	}
	return out
}

func equal(a, b []string) bool {
	if len(a) != len(b) {
		return false
	}
	for i := range a {
		if a[i] != b[i] {
			return false
		}
	}
	return true
}

func TestDecodeLZ4WithMatch(t *testing.T) {
	// "abc", then copy 9 bytes from 3 back: "abcabcabcabc".
	block := []byte{0x35, 'a', 'b', 'c', 0x03, 0x00}
	out, err := decodeLZ4(block, 12)
	if err != nil || string(out) != "abcabcabcabc" {
		t.Fatalf("got %q, %v", out, err)
	}
}

func TestDecodeLZ4RejectsBadOffset(t *testing.T) {
	if _, err := decodeLZ4([]byte{0x10, 'a', 0x05, 0x00}, 5); err == nil {
		t.Fatal("expected an error")
	}
}

func TestDecodeLZ4RejectsWrongSize(t *testing.T) {
	if _, err := decodeLZ4(literalBlock([]byte("hello")), 6); err == nil {
		t.Fatal("expected an error")
	}
}

func TestFramesAcrossChunks(t *testing.T) {
	stream := append(tick(1), frame([]byte{0x33, 0x36, 1, 2, 3})...)
	stream = append(stream, tick(2)...)

	d := NewDecoder()
	var got []Message
	for _, b := range stream {
		got = append(got, d.Feed([]byte{b})...)
	}

	if !equal(types(got), []string{"0036", "3336", "0036"}) {
		t.Fatalf("got %v", types(got))
	}
	if !bytes.Equal(got[1].Body, []byte{1, 2, 3}) {
		t.Fatalf("body %v", got[1].Body)
	}
}

func TestLongFrameUsesTwoByteLength(t *testing.T) {
	body := append([]byte{0x11, 0x56}, make([]byte, 300)...)
	got := NewDecoder().Feed(frame(body))
	if len(got) != 1 || len(got[0].Body) != 300 {
		t.Fatalf("got %d messages", len(got))
	}
}

func TestPaddingBetweenFrames(t *testing.T) {
	stream := append(tick(1), 0, 0)
	stream = append(stream, tick(2)...)
	got := NewDecoder().Feed(stream)
	if len(got) != 2 {
		t.Fatalf("got %v", types(got))
	}
}

func TestBundleUnpacksInnerFrames(t *testing.T) {
	inner := append(frame([]byte{0x00, 0x90, 9}), frame([]byte{0x0b, 0x61, 8})...)
	got := NewDecoder().Feed(append(bundle(inner), tick(1)...))
	if !equal(types(got), []string{"0090", "0b61", "0036"}) {
		t.Fatalf("got %v", types(got))
	}
}

func TestFlaggedBundle(t *testing.T) {
	inner := frame([]byte{0x56, 0xe2, 1})
	body := []byte{0xf3, 0xff, 0xff}
	body = binary.LittleEndian.AppendUint32(body, uint32(len(inner)))
	body = append(body, literalBlock(inner)...)
	got := NewDecoder().Feed(frame(body))
	if !equal(types(got), []string{"56e2"}) {
		t.Fatalf("got %v", types(got))
	}
}

func TestBrokenBundleIsCountedAndSkipped(t *testing.T) {
	body := []byte{0xff, 0xff, 50, 0, 0, 0, 0x10, 'a'}
	d := NewDecoder()
	got := d.Feed(append(frame(body), tick(1)...))
	if !equal(types(got), []string{"0036"}) || d.BadBundles != 1 {
		t.Fatalf("got %v, bad %d", types(got), d.BadBundles)
	}
}

func TestJoinsMidwayAtTicks(t *testing.T) {
	var stream []byte
	// The tail of some frame we missed the start of.
	stream = append(stream, 0x99, 0x42, 0x13, 0x07)
	for n := byte(0); n < 8; n++ {
		stream = append(stream, tick(n)...)
	}
	stream = append(stream, frame([]byte{0x33, 0x36, 7})...)

	d := NewDecoderMidway()
	got := d.Feed(stream)
	if !d.Synced() || len(got) != 9 || got[8].Type() != "3336" {
		t.Fatalf("synced %v, got %v", d.Synced(), types(got))
	}
}

func TestMidwayWaitsForEnoughFrames(t *testing.T) {
	d := NewDecoderMidway()
	if got := d.Feed(append([]byte{0x77}, tick(1)...)); len(got) != 0 {
		t.Fatalf("got %v before enough frames", types(got))
	}
	var more []byte
	for n := byte(2); n < 8; n++ {
		more = append(more, tick(n)...)
	}
	if got := d.Feed(more); len(got) != 7 {
		t.Fatalf("got %d", len(got))
	}
}

func TestLostResyncs(t *testing.T) {
	d := NewDecoder()
	d.Feed(tick(1))
	d.Lost()
	var stream []byte
	stream = append(stream, 0x05, 0x06)
	for n := byte(0); n < 7; n++ {
		stream = append(stream, tick(n)...)
	}
	if got := d.Feed(stream); len(got) != 7 {
		t.Fatalf("got %d", len(got))
	}
}

func TestInvalidHeaderResyncs(t *testing.T) {
	stream := append(tick(1), 0x02)
	for n := byte(0); n < 7; n++ {
		stream = append(stream, tick(n)...)
	}
	got := NewDecoder().Feed(stream)
	if len(got) != 8 {
		t.Fatalf("got %d", len(got))
	}
}
