package record

import (
	"bytes"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	"daevanion-companion/internal/wire"
)

var at = time.Date(2026, 11, 12, 2, 30, 1, 250_000_000, time.Local)

func TestMessageLine(t *testing.T) {
	var buf bytes.Buffer
	r := New(&buf)
	r.Message("conn", wire.Message{Op: [2]byte{0x0c, 0x61}, Body: []byte{0x00, 0x08}}, at)
	r.Flush()

	want := "02:30:01.250  0c61       4B  conn  counter change\n    0008\n"
	if buf.String() != want || r.Count != 1 {
		t.Fatalf("got %q (%d)", buf.String(), r.Count)
	}
}

func TestNoiseIsLeftOut(t *testing.T) {
	var buf bytes.Buffer
	r := New(&buf)
	r.Message("conn", wire.Message{Op: [2]byte{0x00, 0x36}, Body: make([]byte, 8)}, at)
	r.Flush()
	if buf.Len() != 0 || r.Count != 0 {
		t.Fatalf("logged the tick: %q", buf.String())
	}
}

func TestUnknownTypesHaveNoLabel(t *testing.T) {
	var buf bytes.Buffer
	r := New(&buf)
	r.Message("conn", wire.Message{Op: [2]byte{0x07, 0x95}}, at)
	r.Flush()
	if !strings.HasPrefix(buf.String(), "02:30:01.250  0795       2B  conn  \n") {
		t.Fatalf("got %q", buf.String())
	}
}

func TestCreateNamesAFileInAFolder(t *testing.T) {
	dir := t.TempDir()
	r, path, err := Create(dir, at)
	if err != nil {
		t.Fatal(err)
	}
	r.Note(at, "Playing Testchar")
	if err := r.Close(); err != nil {
		t.Fatal(err)
	}
	if filepath.Base(path) != "session-2026-11-12-023001.log" {
		t.Fatalf("path %s", path)
	}
	data, _ := os.ReadFile(path)
	if !strings.Contains(string(data), "# Daevanion Companion session") || !strings.Contains(string(data), "02:30:01.250  # Playing Testchar") {
		t.Fatalf("file %q", data)
	}
}

func TestPrivateBodiesAreLeftOut(t *testing.T) {
	var buf bytes.Buffer
	r := New(&buf)
	r.Message("conn", wire.Message{Op: [2]byte{0x15, 0x36}, Body: []byte{0xab, 0xcd}}, at)
	r.Flush()

	if strings.Contains(buf.String(), "abcd") || !strings.Contains(buf.String(), "1536") || !strings.Contains(buf.String(), "(left out)") {
		t.Fatalf("got %q", buf.String())
	}
}
