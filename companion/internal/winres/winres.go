// Package winres builds a COFF object holding Windows resources (.rsrc), the
// kind of .syso file `go build` links into an .exe. It covers what the
// companion needs: an icon group, version info and the manifest.
package winres

import (
	"encoding/binary"
	"errors"
	"sort"
	"unicode/utf16"
)

// Resource types and the language every resource uses (US English).
const (
	TypeIcon      = 3
	TypeGroupIcon = 14
	TypeVersion   = 16
	TypeManifest  = 24
	language      = 0x0409
)

// Resource is one resource's raw data.
type Resource struct {
	Type uint16
	ID   uint16
	Data []byte
}

// Icon splits an .ico file into one RT_ICON per image and the RT_GROUP_ICON
// (id 1) that lists them: Windows shows group 1 as the program's icon.
func Icon(ico []byte) ([]Resource, error) {
	if len(ico) < 6 || binary.LittleEndian.Uint16(ico[2:]) != 1 {
		return nil, errors.New("not an .ico file")
	}
	count := int(binary.LittleEndian.Uint16(ico[4:]))
	if len(ico) < 6+16*count {
		return nil, errors.New("the .ico file is cut short")
	}

	group := binary.LittleEndian.AppendUint16(nil, 0)
	group = binary.LittleEndian.AppendUint16(group, 1)
	group = binary.LittleEndian.AppendUint16(group, uint16(count))
	var resources []Resource
	for i := 0; i < count; i++ {
		entry := ico[6+16*i : 6+16*(i+1)]
		size := binary.LittleEndian.Uint32(entry[8:])
		offset := binary.LittleEndian.Uint32(entry[12:])
		if uint64(offset)+uint64(size) > uint64(len(ico)) {
			return nil, errors.New("an image lies outside the .ico file")
		}
		id := uint16(i + 1)
		resources = append(resources, Resource{Type: TypeIcon, ID: id, Data: ico[offset : offset+size]})
		// The file's entry, with the image's resource id instead of its offset.
		group = append(group, entry[:12]...)
		group = binary.LittleEndian.AppendUint16(group, id)
	}
	return append(resources, Resource{Type: TypeGroupIcon, ID: 1, Data: group}), nil
}

// VersionInfo is what Explorer's Details tab and Task Manager show.
type VersionInfo struct {
	Version     [4]uint16
	Description string
	Product     string
	File        string
}

func utf16z(s string) []byte {
	var out []byte
	for _, c := range utf16.Encode([]rune(s)) {
		out = binary.LittleEndian.AppendUint16(out, c)
	}
	return append(out, 0, 0)
}

func pad4(b []byte) []byte {
	for len(b)%4 != 0 {
		b = append(b, 0)
	}
	return b
}

// node is one VS_VERSIONINFO block: length, value length, type (1 = text),
// key, its value and its children, each on a 4-byte boundary.
func node(key string, value []byte, valueLength uint16, text bool, children ...[]byte) []byte {
	b := make([]byte, 6)
	b = pad4(append(b, utf16z(key)...))
	b = append(b, value...)
	for _, child := range children {
		b = append(pad4(b), child...)
	}
	binary.LittleEndian.PutUint16(b[0:], uint16(len(b)))
	binary.LittleEndian.PutUint16(b[2:], valueLength)
	if text {
		binary.LittleEndian.PutUint16(b[4:], 1)
	}
	return b
}

func text(key, value string) []byte {
	return node(key, utf16z(value), uint16(len(utf16.Encode([]rune(value)))+1), true)
}

// Version builds the RT_VERSION resource (id 1).
func Version(info VersionInfo) Resource {
	v := info.Version
	ms := uint32(v[0])<<16 | uint32(v[1])
	ls := uint32(v[2])<<16 | uint32(v[3])
	var fixed []byte
	for _, field := range []uint32{
		0xFEEF04BD, 0x00010000, // signature, structure version
		ms, ls, ms, ls, // file and product version
		0x3F, 0, // flags mask, flags
		0x00040004, 1, 0, // Windows NT, an app, no subtype
		0, 0, // date
	} {
		fixed = binary.LittleEndian.AppendUint32(fixed, field)
	}
	number := []rune{}
	for i, part := range v {
		if i > 0 {
			number = append(number, '.')
		}
		number = append(number, []rune(itoa(int(part)))...)
	}

	strings := node("StringFileInfo", nil, 0, true,
		node("040904b0", nil, 0, true,
			text("FileDescription", info.Description),
			text("FileVersion", string(number)),
			text("InternalName", info.Product),
			text("OriginalFilename", info.File),
			text("ProductName", info.Product),
			text("ProductVersion", string(number)),
		),
	)
	translation := binary.LittleEndian.AppendUint16(nil, language)
	translation = binary.LittleEndian.AppendUint16(translation, 0x04b0)
	vars := node("VarFileInfo", nil, 0, true, node("Translation", translation, 4, false))

	return Resource{Type: TypeVersion, ID: 1, Data: node("VS_VERSION_INFO", fixed, uint16(len(fixed)), false, strings, vars)}
}

// manifest asks for Common Controls 6, so buttons, checkboxes and edit boxes
// draw in the current Windows style instead of the Windows 95 one, and says
// the app knows Windows 10 and 11.
const manifest = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<assembly xmlns="urn:schemas-microsoft-com:asm.v1" manifestVersion="1.0">
  <dependency>
    <dependentAssembly>
      <assemblyIdentity type="win32" name="Microsoft.Windows.Common-Controls" version="6.0.0.0" processorArchitecture="*" publicKeyToken="6595b64144ccf1df" language="*"/>
    </dependentAssembly>
  </dependency>
  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}"/>
    </application>
  </compatibility>
</assembly>
`

// Manifest builds the RT_MANIFEST resource (id 1, the one an .exe reads).
func Manifest() Resource {
	return Resource{Type: TypeManifest, ID: 1, Data: []byte(manifest)}
}

func itoa(n int) string {
	if n == 0 {
		return "0"
	}
	var digits []byte
	for ; n > 0; n /= 10 {
		digits = append([]byte{byte('0' + n%10)}, digits...)
	}
	return string(digits)
}

// Object lays the resources out as a .rsrc section (type, then id, then
// language directories, data entries, then the data) in an amd64 COFF
// object. Data entries point at their data by an address the linker fills
// in (ADDR32NB relocations against the section).
func Object(resources []Resource) []byte {
	sorted := append([]Resource(nil), resources...)
	sort.Slice(sorted, func(a, b int) bool {
		if sorted[a].Type != sorted[b].Type {
			return sorted[a].Type < sorted[b].Type
		}
		return sorted[a].ID < sorted[b].ID
	})
	var types []uint16
	for i, r := range sorted {
		if i == 0 || r.Type != sorted[i-1].Type {
			types = append(types, r.Type)
		}
	}

	// Sizes first, to know every offset.
	dirSize := func(entries int) int { return 16 + 8*entries }
	at := dirSize(len(types))
	typeDirAt := map[uint16]int{}
	for _, t := range types {
		typeDirAt[t] = at
		n := 0
		for _, r := range sorted {
			if r.Type == t {
				n++
			}
		}
		at += dirSize(n)
	}
	langDirAt := make([]int, len(sorted))
	for i := range sorted {
		langDirAt[i] = at
		at += dirSize(1)
	}
	entryAt := make([]int, len(sorted))
	for i := range sorted {
		entryAt[i] = at
		at += 16
	}
	dataAt := make([]int, len(sorted))
	for i, r := range sorted {
		at = (at + 7) &^ 7
		dataAt[i] = at
		at += len(r.Data)
	}

	section := make([]byte, (at+7)&^7)
	put16 := func(p int, v uint16) { binary.LittleEndian.PutUint16(section[p:], v) }
	put32 := func(p int, v uint32) { binary.LittleEndian.PutUint32(section[p:], v) }
	directory := func(p, entries int) { put16(p+14, uint16(entries)) }
	const subdirectory = 0x80000000

	directory(0, len(types))
	for i, t := range types {
		put32(16+8*i, uint32(t))
		put32(16+8*i+4, subdirectory|uint32(typeDirAt[t]))
	}
	slot := map[uint16]int{}
	var relocations []uint32
	for i, r := range sorted {
		dir := typeDirAt[r.Type]
		k := slot[r.Type]
		slot[r.Type]++
		directory(dir, k+1)
		put32(dir+16+8*k, uint32(r.ID))
		put32(dir+16+8*k+4, subdirectory|uint32(langDirAt[i]))

		directory(langDirAt[i], 1)
		put32(langDirAt[i]+16, language)
		put32(langDirAt[i]+20, uint32(entryAt[i]))

		put32(entryAt[i], uint32(dataAt[i]))
		put32(entryAt[i]+4, uint32(len(r.Data)))
		relocations = append(relocations, uint32(entryAt[i]))
		copy(section[dataAt[i]:], r.Data)
	}

	// File header, one section header, the section, its relocations, one
	// symbol (the section) and an empty string table.
	const headers = 20 + 40
	relocAt := headers + len(section)
	symbolsAt := relocAt + 10*len(relocations)
	var out []byte
	out = binary.LittleEndian.AppendUint16(out, 0x8664)
	out = binary.LittleEndian.AppendUint16(out, 1)
	out = binary.LittleEndian.AppendUint32(out, 0)
	out = binary.LittleEndian.AppendUint32(out, uint32(symbolsAt))
	out = binary.LittleEndian.AppendUint32(out, 1)
	out = binary.LittleEndian.AppendUint16(out, 0)
	out = binary.LittleEndian.AppendUint16(out, 0x0004)

	out = append(out, ".rsrc\x00\x00\x00"...)
	out = binary.LittleEndian.AppendUint32(out, 0)
	out = binary.LittleEndian.AppendUint32(out, 0)
	out = binary.LittleEndian.AppendUint32(out, uint32(len(section)))
	out = binary.LittleEndian.AppendUint32(out, headers)
	out = binary.LittleEndian.AppendUint32(out, uint32(relocAt))
	out = binary.LittleEndian.AppendUint32(out, 0)
	out = binary.LittleEndian.AppendUint16(out, uint16(len(relocations)))
	out = binary.LittleEndian.AppendUint16(out, 0)
	out = binary.LittleEndian.AppendUint32(out, 0x40000040)

	out = append(out, section...)
	for _, r := range relocations {
		out = binary.LittleEndian.AppendUint32(out, r)
		out = binary.LittleEndian.AppendUint32(out, 0)
		out = binary.LittleEndian.AppendUint16(out, 3) // IMAGE_REL_AMD64_ADDR32NB
	}

	out = append(out, ".rsrc\x00\x00\x00"...)
	out = binary.LittleEndian.AppendUint32(out, 0)
	out = binary.LittleEndian.AppendUint16(out, 1)
	out = binary.LittleEndian.AppendUint16(out, 0)
	out = append(out, 3, 0) // static, no aux symbols
	return binary.LittleEndian.AppendUint32(out, 4)
}
