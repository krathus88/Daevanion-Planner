// Package capture reads live packets through Npcap's wpcap.dll, loaded at
// run time, so the companion needs neither cgo nor the Npcap SDK.
package capture

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"syscall"
	"time"
	"unsafe"

	"daevanion-companion/internal/netio"
)

const (
	snapLength  = 65535
	readTimeout = 250
	errorBuffer = 256
)

// ErrNoNpcap means Npcap isn't installed.
var ErrNoNpcap = errors.New("npcap is not installed")

type library struct {
	findAllDevs, freeAllDevs, openLive, dataLink *syscall.Proc
	compile, setFilter, freeCode, nextEx, getErr *syscall.Proc
	close                                        *syscall.Proc
}

var (
	loadOnce sync.Once
	lib      *library
	loadErr  error
)

func load() (*library, error) {
	loadOnce.Do(func() {
		dir := filepath.Join(os.Getenv("SystemRoot"), "System32", "Npcap")
		if _, err := os.Stat(filepath.Join(dir, "wpcap.dll")); err != nil {
			loadErr = ErrNoNpcap
			return
		}

		// wpcap.dll loads Packet.dll from its own folder.
		kernel := syscall.MustLoadDLL("kernel32.dll")
		setDir := kernel.MustFindProc("SetDllDirectoryW")
		dirPtr, _ := syscall.UTF16PtrFromString(dir)
		setDir.Call(uintptr(unsafe.Pointer(dirPtr)))

		dll, err := syscall.LoadDLL(filepath.Join(dir, "wpcap.dll"))
		if err != nil {
			loadErr = fmt.Errorf("loading Npcap: %w", err)
			return
		}

		l := &library{}
		procs := map[string]**syscall.Proc{
			"pcap_findalldevs": &l.findAllDevs,
			"pcap_freealldevs": &l.freeAllDevs,
			"pcap_open_live":   &l.openLive,
			"pcap_datalink":    &l.dataLink,
			"pcap_compile":     &l.compile,
			"pcap_setfilter":   &l.setFilter,
			"pcap_freecode":    &l.freeCode,
			"pcap_next_ex":     &l.nextEx,
			"pcap_geterr":      &l.getErr,
			"pcap_close":       &l.close,
		}
		for name, target := range procs {
			proc, err := dll.FindProc(name)
			if err != nil {
				loadErr = fmt.Errorf("npcap is missing %s", name)
				return
			}
			*target = proc
		}
		lib = l
	})

	return lib, loadErr
}

// pcap_if_t
type deviceEntry struct {
	next        *deviceEntry
	name        *byte
	description *byte
	addresses   uintptr
	flags       uint32
}

// struct bpf_program
type bpfProgram struct {
	length uint32
	_      uint32
	insns  uintptr
}

// struct pcap_pkthdr on Windows: a 32-bit timeval.
type packetHeader struct {
	seconds  int32
	micros   int32
	captured uint32
	length   uint32
}

const loopbackFlag = 0x1

func goString(p *byte) string {
	if p == nil {
		return ""
	}
	var b []byte
	for ptr := unsafe.Pointer(p); *(*byte)(ptr) != 0; ptr = unsafe.Add(ptr, 1) {
		b = append(b, *(*byte)(ptr))
	}
	return string(b)
}

// Device is one network adapter.
type Device struct {
	Name        string
	Description string
}

// Devices lists the adapters Npcap can capture on, loopback left out.
func Devices() ([]Device, error) {
	l, err := load()
	if err != nil {
		return nil, err
	}

	var first *deviceEntry
	errBuf := make([]byte, errorBuffer)
	r, _, _ := l.findAllDevs.Call(uintptr(unsafe.Pointer(&first)), uintptr(unsafe.Pointer(&errBuf[0])))
	if int32(r) != 0 {
		return nil, fmt.Errorf("listing adapters: %s", goString(&errBuf[0]))
	}
	defer l.freeAllDevs.Call(uintptr(unsafe.Pointer(first)))

	var devices []Device
	for d := first; d != nil; d = d.next {
		if d.flags&loopbackFlag != 0 {
			continue
		}
		devices = append(devices, Device{Name: goString(d.name), Description: goString(d.description)})
	}
	return devices, nil
}

// Handle is one open adapter.
type Handle struct {
	l      *library
	handle uintptr
	link   int
	Device Device
}

// Open starts capturing on a device with a BPF filter.
func Open(device Device, filter string) (*Handle, error) {
	l, err := load()
	if err != nil {
		return nil, err
	}

	errBuf := make([]byte, errorBuffer)
	name := append([]byte(device.Name), 0)
	handle, _, _ := l.openLive.Call(
		uintptr(unsafe.Pointer(&name[0])),
		snapLength,
		0,
		readTimeout,
		uintptr(unsafe.Pointer(&errBuf[0])),
	)
	if handle == 0 {
		return nil, fmt.Errorf("opening %s: %s", device.Description, goString(&errBuf[0]))
	}

	h := &Handle{l: l, handle: handle, Device: device}
	link, _, _ := l.dataLink.Call(handle)
	h.link = int(int32(link))

	var program bpfProgram
	expr := append([]byte(filter), 0)
	const netmaskUnknown = 0xffffffff
	if r, _, _ := l.compile.Call(handle, uintptr(unsafe.Pointer(&program)), uintptr(unsafe.Pointer(&expr[0])), 1, netmaskUnknown); int32(r) != 0 {
		message := h.lastError()
		h.Close()
		return nil, fmt.Errorf("filter on %s: %s", device.Description, message)
	}
	defer l.freeCode.Call(uintptr(unsafe.Pointer(&program)))
	if r, _, _ := l.setFilter.Call(handle, uintptr(unsafe.Pointer(&program))); int32(r) != 0 {
		message := h.lastError()
		h.Close()
		return nil, fmt.Errorf("filter on %s: %s", device.Description, message)
	}

	return h, nil
}

func (h *Handle) lastError() string {
	r, _, _ := h.l.getErr.Call(h.handle)
	// A C string owned by Npcap.
	return strings.TrimSpace(goString((*byte)(unsafe.Add(unsafe.Pointer(nil), r))))
}

// Close stops the capture.
func (h *Handle) Close() {
	if h.handle != 0 {
		h.l.close.Call(h.handle)
		h.handle = 0
	}
}

// Next waits up to the read timeout for a packet. ok is false on a timeout.
func (h *Handle) Next() (packet netio.Packet, ok bool, err error) {
	var header *packetHeader
	var data *byte
	r, _, _ := h.l.nextEx.Call(h.handle, uintptr(unsafe.Pointer(&header)), uintptr(unsafe.Pointer(&data)))

	switch int32(r) {
	case 1:
		bytes := append([]byte(nil), unsafe.Slice(data, header.captured)...)
		return netio.Packet{
			Time: time.Unix(int64(header.seconds), int64(header.micros)*1000),
			Link: h.link,
			Data: bytes,
		}, true, nil
	case 0:
		return netio.Packet{}, false, nil
	default:
		return netio.Packet{}, false, fmt.Errorf("reading %s: %s", h.Device.Description, h.lastError())
	}
}
