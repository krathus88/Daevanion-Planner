package desktop

import (
	"encoding/binary"
	"syscall"
	"unsafe"

	"daevanion-companion/internal/pipeline"
)

// Where the widget goes: the work area of the monitor showing the game, found
// as the biggest visible window of the process holding a connection to the
// game's servers. Without one (game closed, minimized), the main monitor's.

var (
	iphlpapi = syscall.NewLazyDLL("iphlpapi.dll")
	shcore   = syscall.NewLazyDLL("shcore.dll")

	getExtendedTcpTable      = iphlpapi.NewProc("GetExtendedTcpTable")
	enumWindows              = user32.NewProc("EnumWindows")
	getWindowThreadProcessId = user32.NewProc("GetWindowThreadProcessId")
	isWindowVisible          = user32.NewProc("IsWindowVisible")
	isIconic                 = user32.NewProc("IsIconic")
	getWindowRect            = user32.NewProc("GetWindowRect")
	monitorFromWindow        = user32.NewProc("MonitorFromWindow")
	monitorFromPoint         = user32.NewProc("MonitorFromPoint")
	getMonitorInfo           = user32.NewProc("GetMonitorInfoW")
	getDpiForMonitor         = shcore.NewProc("GetDpiForMonitor")
)

const (
	afInet                  = 2
	tcpTableOwnerPidAll     = 5
	tcpStateEstablished     = 5
	monitorDefaultToPrimary = 1
	monitorDefaultToNearest = 2
	mdtEffectiveDpi         = 0
)

type monitorInfo struct {
	Size    uint32
	Monitor rect
	Work    rect
	Flags   uint32
}

// gamePID is the process with an open connection to the game's servers, or
// 0.
func gamePID() uint32 {
	var size uint32
	getExtendedTcpTable.Call(0, uintptr(unsafe.Pointer(&size)), 0, afInet, tcpTableOwnerPidAll, 0)
	if size == 0 {
		return 0
	}
	// The table can grow between the two calls.
	size += 1024
	table := make([]byte, size)
	if r, _, _ := getExtendedTcpTable.Call(uintptr(unsafe.Pointer(&table[0])), uintptr(unsafe.Pointer(&size)), 0, afInet, tcpTableOwnerPidAll, 0); r != 0 {
		return 0
	}
	return ownerOfRemotePort(table[:size], pipeline.GamePort)
}

// ownerOfRemotePort reads a MIB_TCPTABLE_OWNER_PID (u32 count, then rows of
// state, local address, local port, remote address, remote port, pid, all
// u32; ports big endian in the low two bytes) for the process of the first
// established connection to the port.
func ownerOfRemotePort(table []byte, port uint16) uint32 {
	const row = 24
	if len(table) < 4 {
		return 0
	}
	count := int(binary.LittleEndian.Uint32(table))
	for i := 0; i < count; i++ {
		at := 4 + i*row
		if at+row > len(table) {
			break
		}
		state := binary.LittleEndian.Uint32(table[at:])
		remote := binary.BigEndian.Uint16(table[at+16:])
		if state == tcpStateEstablished && remote == port {
			return binary.LittleEndian.Uint32(table[at+20:])
		}
	}
	return 0
}

// The window search runs on the tray's thread, one at a time.
var (
	searchPID  uint32
	searchBest uintptr
	searchArea int64
	enumProc   = syscall.NewCallback(func(hwnd, _ uintptr) uintptr {
		var pid uint32
		getWindowThreadProcessId.Call(hwnd, uintptr(unsafe.Pointer(&pid)))
		if pid != searchPID {
			return 1
		}
		if visible, _, _ := isWindowVisible.Call(hwnd); visible == 0 {
			return 1
		}
		if minimized, _, _ := isIconic.Call(hwnd); minimized != 0 {
			return 1
		}
		var r rect
		getWindowRect.Call(hwnd, uintptr(unsafe.Pointer(&r)))
		if area := int64(r.Right-r.Left) * int64(r.Bottom-r.Top); area > searchArea {
			searchBest, searchArea = hwnd, area
		}
		return 1
	})
)

// gameWindow is the game's biggest visible window, or 0.
func gameWindow() uintptr {
	pid := gamePID()
	if pid == 0 {
		return 0
	}
	searchPID, searchBest, searchArea = pid, 0, 0
	enumWindows.Call(enumProc, 0)
	return searchBest
}

// widgetMonitor is the monitor to put the widget on: the game's, else the
// main one.
func widgetMonitor() uintptr {
	if hwnd := gameWindow(); hwnd != 0 {
		monitor, _, _ := monitorFromWindow.Call(hwnd, monitorDefaultToNearest)
		if monitor != 0 {
			return monitor
		}
	}
	// POINT{0, 0} by value: the main monitor's top left corner.
	monitor, _, _ := monitorFromPoint.Call(0, monitorDefaultToPrimary)
	return monitor
}

// workArea is the monitor's area without the taskbar, and its scale (1 at
// 96 DPI), 0 when unknown.
func workArea(monitor uintptr) (rect, float64) {
	info := monitorInfo{}
	info.Size = uint32(unsafe.Sizeof(info))
	if r, _, _ := getMonitorInfo.Call(monitor, uintptr(unsafe.Pointer(&info))); r == 0 {
		var area rect
		systemParametersInfo.Call(spiGetWorkArea, 0, uintptr(unsafe.Pointer(&area)), 0)
		return area, 0
	}
	var dpiX, dpiY uint32
	if getDpiForMonitor.Find() == nil {
		if r, _, _ := getDpiForMonitor.Call(monitor, mdtEffectiveDpi, uintptr(unsafe.Pointer(&dpiX)), uintptr(unsafe.Pointer(&dpiY))); r != 0 {
			dpiX = 0
		}
	}
	return info.Work, float64(dpiX) / 96
}
