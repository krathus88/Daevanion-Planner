package winres

import (
	"bytes"
	"encoding/binary"
	"strings"
	"testing"
	"unicode/utf16"
)

// An .ico file with two made-up images.
func testIcon() []byte {
	images := [][]byte{[]byte("small"), []byte("bigger image")}
	ico := []byte{0, 0, 1, 0, byte(len(images)), 0}
	offset := 6 + 16*len(images)
	for i, image := range images {
		size := byte(16 * (i + 1))
		ico = append(ico, size, size, 0, 0, 1, 0, 32, 0)
		ico = binary.LittleEndian.AppendUint32(ico, uint32(len(image)))
		ico = binary.LittleEndian.AppendUint32(ico, uint32(offset))
		offset += len(image)
	}
	for _, image := range images {
		ico = append(ico, image...)
	}
	return ico
}

func TestIconSplitsTheImages(t *testing.T) {
	resources, err := Icon(testIcon())
	if err != nil || len(resources) != 3 {
		t.Fatalf("got %d resources, %v", len(resources), err)
	}
	if string(resources[1].Data) != "bigger image" || resources[1].Type != TypeIcon || resources[1].ID != 2 {
		t.Fatalf("image %+v", resources[1])
	}
	group := resources[2]
	if group.Type != TypeGroupIcon || group.ID != 1 || len(group.Data) != 6+14*2 {
		t.Fatalf("group %+v", group)
	}
	// The second entry names image 2 by id.
	if binary.LittleEndian.Uint16(group.Data[6+14+12:]) != 2 || group.Data[6+14] != 32 {
		t.Fatalf("group data %x", group.Data)
	}
}

func TestIconRejectsOtherFiles(t *testing.T) {
	if _, err := Icon([]byte("\x89PNG....")); err == nil {
		t.Fatal("read a PNG as an icon")
	}
	broken := testIcon()[:30]
	if _, err := Icon(broken); err == nil {
		t.Fatal("read a cut .ico")
	}
}

func TestVersionHoldsTheNames(t *testing.T) {
	r := Version(VersionInfo{Version: [4]uint16{1, 2, 0, 0}, Description: "Daevanion Companion", Product: "Daevanion Companion", File: "x.exe"})
	if r.Type != TypeVersion || int(binary.LittleEndian.Uint16(r.Data)) != len(r.Data) {
		t.Fatalf("length %d of %d", binary.LittleEndian.Uint16(r.Data), len(r.Data))
	}
	wide := func(s string) []byte {
		var out []byte
		for _, c := range utf16.Encode([]rune(s)) {
			out = binary.LittleEndian.AppendUint16(out, c)
		}
		return out
	}
	for _, want := range []string{"VS_VERSION_INFO", "FileDescription", "Daevanion Companion", "1.2.0.0"} {
		if !bytes.Contains(r.Data, wide(want)) {
			t.Errorf("missing %q", want)
		}
	}
	if !bytes.Contains(r.Data, []byte{0xBD, 0x04, 0xEF, 0xFE}) {
		t.Error("missing the fixed info's signature")
	}
}

func TestObjectLayout(t *testing.T) {
	resources, _ := Icon(testIcon())
	obj := Object(resources)
	if binary.LittleEndian.Uint16(obj) != 0x8664 || string(obj[20:25]) != ".rsrc" {
		t.Fatalf("headers %x", obj[:28])
	}
	section := obj[60 : 60+binary.LittleEndian.Uint32(obj[36:])]
	// Two types, icons (3) first, both subdirectories.
	if binary.LittleEndian.Uint16(section[14:]) != 2 || binary.LittleEndian.Uint32(section[16:]) != TypeIcon {
		t.Fatalf("root %x", section[:32])
	}
	// One relocation per resource, each at a data entry that points at its data.
	relocations := int(binary.LittleEndian.Uint16(obj[52:]))
	if relocations != 3 {
		t.Fatalf("%d relocations", relocations)
	}
	relocAt := int(binary.LittleEndian.Uint32(obj[44:]))
	entry := int(binary.LittleEndian.Uint32(obj[relocAt:]))
	data := binary.LittleEndian.Uint32(section[entry:])
	size := binary.LittleEndian.Uint32(section[entry+4:])
	if string(section[data:data+size]) != "small" {
		t.Fatalf("first resource %q", section[data:data+size])
	}
}

func TestManifestAsksForCommonControls6(t *testing.T) {
	m := Manifest()
	if m.Type != TypeManifest || m.ID != 1 || !strings.Contains(string(m.Data), `name="Microsoft.Windows.Common-Controls" version="6.0.0.0"`) {
		t.Fatalf("got %d %d %s", m.Type, m.ID, m.Data)
	}
}
