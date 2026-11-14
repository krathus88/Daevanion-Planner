package desktop

import (
	"syscall"
	"time"
	"unsafe"
)

// Overlays follow the game window: a WinEvent hook on the game's process
// says when its window moves, resizes (Win+Shift+Arrow to another monitor
// included) or is minimized or restored, and the shown overlays are laid out
// again. No polling: nothing runs while the game window stays put. Events
// come in bursts while dragging, so they're gathered into one layout per
// followDelayMs. All on the tray's thread, whose message loop the hook needs.

var (
	setWinEventHook = user32.NewProc("SetWinEventHook")
	unhookWinEvent  = user32.NewProc("UnhookWinEvent")
	isWindow        = user32.NewProc("IsWindow")
)

const (
	eventMinimizeStart   = 0x0016
	eventMinimizeEnd     = 0x0017
	eventLocationChange  = 0x800B
	winEventOutOfContext = 0
	objIDWindow          = 0
	// On the tray window: lay the overlays out again.
	timerFollow   = 3
	followDelayMs = 15
	// How long a found game window is trusted before searching again (the
	// search reads the TCP table and walks every window).
	gameSearchEvery = 2 * time.Second
)

var (
	// The game window last found, its process and the hooks on it.
	followHwnd  uintptr
	followPID   uint32
	followHooks []uintptr
	// A layout is waiting on timerFollow.
	followPending bool
	// Where the game window was at the last layout.
	followLast gamePlace
	// When gameWindow last searched.
	gameSearchAt time.Time

	followProc = syscall.NewCallback(func(hook, event, hwnd, object, child, thread, at uintptr) uintptr {
		if hwnd != followHwnd || int32(object) != objIDWindow || int32(child) != 0 {
			return 0
		}
		if !followPending && current != nil {
			followPending = true
			setTimer.Call(current.hwnd, timerFollow, followDelayMs, 0)
		}
		return 0
	})
)

// gamePlace is what the overlays' spots depend on: the game window's client
// area on screen and its monitor.
type gamePlace struct {
	hwnd, monitor uintptr
	corner        point
}

// usableWindow is a window that still exists, shown and not minimized.
func usableWindow(hwnd uintptr) bool {
	if hwnd == 0 {
		return false
	}
	if ok, _, _ := isWindow.Call(hwnd); ok == 0 {
		return false
	}
	if visible, _, _ := isWindowVisible.Call(hwnd); visible == 0 {
		return false
	}
	minimized, _, _ := isIconic.Call(hwnd)
	return minimized == 0
}

// follow watches the game window found, hooking its process when it's a new
// one.
func follow(pid uint32, hwnd uintptr) {
	followHwnd = hwnd
	if pid == followPID {
		return
	}
	unfollow()
	followPID = pid
	for _, events := range [][2]uintptr{{eventMinimizeStart, eventMinimizeEnd}, {eventLocationChange, eventLocationChange}} {
		if hook, _, _ := setWinEventHook.Call(events[0], events[1], 0, followProc, uintptr(pid), 0, winEventOutOfContext); hook != 0 {
			followHooks = append(followHooks, hook)
		}
	}
}

// unfollow removes the hooks.
func unfollow() {
	for _, hook := range followHooks {
		unhookWinEvent.Call(hook)
	}
	followHooks = nil
	followPID = 0
}

// currentGamePlace is where the game window is now (zero without one).
func currentGamePlace() gamePlace {
	hwnd := gameWindow()
	if hwnd == 0 {
		return gamePlace{}
	}
	var client rect
	getClientRect.Call(hwnd, uintptr(unsafe.Pointer(&client)))
	corner := point{X: client.Right, Y: client.Bottom}
	clientToScreen.Call(hwnd, uintptr(unsafe.Pointer(&corner)))
	monitor, _, _ := monitorFromWindow.Call(hwnd, monitorDefaultToNearest)
	return gamePlace{hwnd: hwnd, monitor: monitor, corner: corner}
}

// overlayShown is whether any overlay is up.
func overlayShown() bool {
	var hwnds []uintptr
	if currentWidget != nil {
		hwnds = append(hwnds, currentWidget.hwnd)
	}
	if currentShopPanel != nil {
		hwnds = append(hwnds, currentShopPanel.hwnd)
	}
	if currentSoulPopup != nil {
		hwnds = append(hwnds, currentSoulPopup.hwnd)
	}
	for _, hwnd := range hwnds {
		if visible, _, _ := isWindowVisible.Call(hwnd); visible != 0 {
			return true
		}
	}
	return false
}

// followTick lays the shown overlays out again if the game window moved.
func followTick(tray uintptr) {
	killTimer.Call(tray, timerFollow)
	followPending = false
	if !overlayShown() {
		return
	}
	place := currentGamePlace()
	if place == followLast {
		return
	}
	followLast = place
	redrawOverlays()
}
