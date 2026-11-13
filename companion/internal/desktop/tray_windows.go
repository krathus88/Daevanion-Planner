// Package desktop is the companion's Windows shell side: the notification
// area (tray) icon and its settings window, starting with Windows, message
// boxes and running only once.
package desktop

import (
	"errors"
	"runtime"
	"sync"
	"syscall"
	"unsafe"
)

var (
	user32  = syscall.NewLazyDLL("user32.dll")
	shell32 = syscall.NewLazyDLL("shell32.dll")
	kernel  = syscall.NewLazyDLL("kernel32.dll")

	registerClassEx       = user32.NewProc("RegisterClassExW")
	createWindowEx        = user32.NewProc("CreateWindowExW")
	defWindowProc         = user32.NewProc("DefWindowProcW")
	destroyWindow         = user32.NewProc("DestroyWindow")
	getMessage            = user32.NewProc("GetMessageW")
	translateMessage      = user32.NewProc("TranslateMessage")
	dispatchMessage       = user32.NewProc("DispatchMessageW")
	postMessage           = user32.NewProc("PostMessageW")
	postQuitMessage       = user32.NewProc("PostQuitMessage")
	registerWindowMessage = user32.NewProc("RegisterWindowMessageW")
	setForegroundWindow   = user32.NewProc("SetForegroundWindow")
	loadImage             = user32.NewProc("LoadImageW")
	loadIcon              = user32.NewProc("LoadIconW")
	getSystemMetrics      = user32.NewProc("GetSystemMetrics")
	shellNotifyIcon       = shell32.NewProc("Shell_NotifyIconW")
	getModuleHandle       = kernel.NewProc("GetModuleHandleW")
)

const (
	wmNull      = 0x0000
	wmDestroy   = 0x0002
	wmClose     = 0x0010
	wmLButtonUp = 0x0202
	wmRButtonUp = 0x0205
	wmTrayIcon  = 0x8000 + 1 // WM_APP + 1

	nimAdd    = 0
	nimModify = 1
	nimDelete = 2

	nifMessage = 0x01
	nifIcon    = 0x02
	nifTip     = 0x04

	imageIcon   = 1
	smCxSmIcon  = 49
	smCySmIcon  = 50
	idiApp      = 32512
	appIconID   = 1 // the icon group the .syso holds (cmd/winres)
	trayIconUID = 1
)

type point struct{ X, Y int32 }

type msg struct {
	HWnd    uintptr
	Message uint32
	WParam  uintptr
	LParam  uintptr
	Time    uint32
	Pt      point
	Private uint32
}

type wndClassEx struct {
	Size       uint32
	Style      uint32
	WndProc    uintptr
	ClsExtra   int32
	WndExtra   int32
	Instance   uintptr
	Icon       uintptr
	Cursor     uintptr
	Background uintptr
	MenuName   *uint16
	ClassName  *uint16
	IconSm     uintptr
}

type notifyIconData struct {
	Size            uint32
	HWnd            uintptr
	ID              uint32
	Flags           uint32
	CallbackMessage uint32
	Icon            uintptr
	Tip             [128]uint16
	State           uint32
	StateMask       uint32
	Info            [256]uint16
	Version         uint32
	InfoTitle       [64]uint16
	InfoFlags       uint32
	GUID            [16]byte
	BalloonIcon     uintptr
}

// Command is something done in the settings window.
type Command int

const (
	CommandNone Command = iota
	CommandLogIn
	CommandLogOut
	CommandStartup
	CommandOpenLog
	CommandRecord
	CommandOpenRecordings
	CommandExit
	// The shop panel's delay changed: Value is the seconds.
	CommandShopHide
	// The overlays' background opacity changed: Value is the percent.
	CommandOverlayOpacity
	// The shop panel's type filter: Value 0 is all, k is shop.Types[k-1].
	CommandShopType
	// Hide Insight level Value (1-3) toggled.
	CommandShopLevel
	// Show only shop.Sources[Value] toggled.
	CommandShopSource
	// Look for a newer version now.
	CommandCheckUpdates
)

// Choice is a command and, for settings, its new value.
type Choice struct {
	Command Command
	Value   int
}

// State is what the settings window shows; it asks for it each time it
// opens and on Refresh.
type State struct {
	// The first line: what the companion is doing.
	Status string
	// A character is being played (the status dot turns green).
	Playing  bool
	LoggedIn bool
	// A login is waiting for the browser.
	LoggingIn bool
	// False offline (-offline): nothing to log in to.
	CanLogIn bool
	// Who is logged in.
	Account string
	// Whether it starts with Windows; StartupAvailable is false when it
	// runs from `go run`, whose .exe is temporary.
	Startup          bool
	StartupAvailable bool
	// Whether the game's messages are being recorded.
	Recording bool
	// How long the shop panel stays after the last shop message.
	ShopHideSeconds int
	// The overlays' background opacity, in percent.
	OverlayOpacity int
	// The shop panel's filters (shop.Filter): the types shown (none: all),
	// hidden Insight levels, and the sources shown (none: all).
	ShopTypes        []string
	ShopHiddenLevels []int
	ShopSources      []string
	// The running version, whether it can update itself (release builds),
	// and whether a check asked for is under way.
	Version         string
	CanUpdate       bool
	CheckingUpdates bool
}

// Tray is the notification area icon.
type Tray struct {
	hwnd           uintptr
	icon           uintptr
	taskbarCreated uint32
	state          func() State
	on             func(Choice)
	done           chan struct{}

	mu  sync.Mutex
	tip string
	// The widget's state, handed to the tray's thread.
	widgetState WidgetState
	widgetText  string
	// The shop panel's view (nil: hidden), handed over the same way.
	shopView *ShopView
	// The opacity preview's sample.
	shopPreview *ShopView
}

// One tray per process: the window procedure finds it here.
var current *Tray

func wide(s string) *uint16 {
	p, _ := syscall.UTF16PtrFromString(s)
	return p
}

func copyWide(dst []uint16, s string) {
	src, _ := syscall.UTF16FromString(s)
	if len(src) > len(dst) {
		src = src[:len(dst)]
		src[len(src)-1] = 0
	}
	copy(dst, src)
}

// NewTray adds the icon. state is called for the settings window's content
// and on for each choice, both on the tray's own thread: keep them quick.
func NewTray(tip string, state func() State, on func(Choice)) (*Tray, error) {
	if current != nil {
		return nil, errors.New("the tray icon is already shown")
	}
	t := &Tray{state: state, on: on, tip: tip, done: make(chan struct{})}
	ready := make(chan error, 1)
	go t.loop(ready)
	if err := <-ready; err != nil {
		return nil, err
	}
	return t, nil
}

func (t *Tray) loop(ready chan<- error) {
	// Windows sends a window's messages to the thread that made it.
	runtime.LockOSThread()
	defer close(t.done)
	makeDPIAware()

	instance, _, _ := getModuleHandle.Call(0)
	className := wide("DaevanionCompanionTray")
	class := wndClassEx{
		WndProc:   syscall.NewCallback(windowProc),
		Instance:  instance,
		ClassName: className,
	}
	class.Size = uint32(unsafe.Sizeof(class))
	if r, _, err := registerClassEx.Call(uintptr(unsafe.Pointer(&class))); r == 0 {
		ready <- err
		return
	}
	current = t
	hwnd, _, err := createWindowEx.Call(0, uintptr(unsafe.Pointer(className)), uintptr(unsafe.Pointer(wide("Daevanion Companion"))), 0, 0, 0, 0, 0, 0, 0, instance, 0)
	if hwnd == 0 {
		ready <- err
		return
	}
	t.hwnd = hwnd
	// Without it the companion still runs, just without the widget.
	newWidget(instance)
	newShopPanel(instance)
	taskbar, _, _ := registerWindowMessage.Call(uintptr(unsafe.Pointer(wide("TaskbarCreated"))))
	t.taskbarCreated = uint32(taskbar)

	cx, _, _ := getSystemMetrics.Call(smCxSmIcon)
	cy, _, _ := getSystemMetrics.Call(smCySmIcon)
	t.icon, _, _ = loadImage.Call(instance, appIconID, imageIcon, cx, cy, 0)
	if t.icon == 0 {
		t.icon, _, _ = loadIcon.Call(0, idiApp)
	}
	if err := t.add(); err != nil {
		ready <- err
		return
	}
	// Without it, a click on the icon does nothing.
	newSettingsWindow(instance, t.icon)
	ready <- nil

	var m msg
	for {
		r, _, _ := getMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if r == 0 || int32(r) == -1 {
			return
		}
		// Tab and Enter between the settings window's controls.
		if s := currentSettings; s != nil {
			if handled, _, _ := isDialogMessage.Call(s.hwnd, uintptr(unsafe.Pointer(&m))); handled != 0 {
				continue
			}
		}
		translateMessage.Call(uintptr(unsafe.Pointer(&m)))
		dispatchMessage.Call(uintptr(unsafe.Pointer(&m)))
	}
}

func (t *Tray) data(flags uint32) notifyIconData {
	d := notifyIconData{HWnd: t.hwnd, ID: trayIconUID, Flags: flags}
	d.Size = uint32(unsafe.Sizeof(d))
	return d
}

func (t *Tray) add() error {
	d := t.data(nifMessage | nifIcon | nifTip)
	d.CallbackMessage = wmTrayIcon
	d.Icon = t.icon
	t.mu.Lock()
	copyWide(d.Tip[:], t.tip)
	t.mu.Unlock()
	if r, _, err := shellNotifyIcon.Call(nimAdd, uintptr(unsafe.Pointer(&d))); r == 0 {
		return err
	}
	return nil
}

// SetTip changes the text shown when hovering the icon.
func (t *Tray) SetTip(tip string) {
	t.mu.Lock()
	t.tip = tip
	t.mu.Unlock()
	d := t.data(nifTip)
	copyWide(d.Tip[:], tip)
	shellNotifyIcon.Call(nimModify, uintptr(unsafe.Pointer(&d)))
}

// ShowWidget updates the widget in the screen's corner (see WidgetState).
func (t *Tray) ShowWidget(state WidgetState, text string) {
	t.mu.Lock()
	t.widgetState = state
	t.widgetText = text
	t.mu.Unlock()
	postMessage.Call(t.hwnd, wmWidget, 0, 0)
}

// ShowShopPets puts up the shop panel with this view, or hides it for nil.
func (t *Tray) ShowShopPets(view *ShopView) {
	t.mu.Lock()
	t.shopView = view
	t.mu.Unlock()
	postMessage.Call(t.hwnd, wmShopPanel, 0, 0)
}

// SetOverlayOpacity sets the overlays' background opacity (percent) and
// redraws those shown.
func (t *Tray) SetOverlayOpacity(percent int) {
	postMessage.Call(t.hwnd, wmOverlay, uintptr(max(0, min(100, percent))), 0)
}

// SetShopPreview is the sample the opacity preview shows in the shop panel.
func (t *Tray) SetShopPreview(view *ShopView) {
	t.mu.Lock()
	t.shopPreview = view
	t.mu.Unlock()
}

func (t *Tray) previewSample() *ShopView {
	t.mu.Lock()
	defer t.mu.Unlock()
	return t.shopPreview
}

// Refresh redraws the settings window from State (when it's open).
func (t *Tray) Refresh() {
	postMessage.Call(t.hwnd, wmRefresh, 0, 0)
}

// Close removes the icon and waits for its thread to end.
func (t *Tray) Close() {
	postMessage.Call(t.hwnd, wmClose, 0, 0)
	<-t.done
}

func windowProc(hwnd, message, wParam, lParam uintptr) uintptr {
	t := current
	switch {
	case t == nil:
	case message == wmTrayIcon:
		switch lParam & 0xffff {
		case wmLButtonUp, wmRButtonUp:
			if currentSettings != nil {
				currentSettings.show(t.state())
			}
		}
		return 0
	case message == wmWidget:
		t.mu.Lock()
		state, text := t.widgetState, t.widgetText
		t.mu.Unlock()
		if currentWidget != nil {
			currentWidget.show(state, text)
		}
		return 0
	case message == wmOverlay:
		overlayBackground = OpacityByte(int(wParam))
		redrawOverlays()
		return 0
	case message == wmRefresh:
		if currentSettings != nil {
			currentSettings.refresh(t.state())
		}
		return 0
	case message == wmShopPanel:
		t.mu.Lock()
		view := t.shopView
		t.mu.Unlock()
		if currentShopPanel != nil {
			currentShopPanel.show(view)
		}
		return 0
	case message == wmClose:
		if currentWidget != nil {
			destroyWindow.Call(currentWidget.hwnd)
		}
		if currentShopPanel != nil {
			destroyWindow.Call(currentShopPanel.hwnd)
		}
		if currentSettings != nil {
			destroyWindow.Call(currentSettings.hwnd)
		}
		destroyWindow.Call(hwnd)
		return 0
	case message == wmDestroy:
		d := t.data(0)
		shellNotifyIcon.Call(nimDelete, uintptr(unsafe.Pointer(&d)))
		postQuitMessage.Call(0)
		return 0
	case t.taskbarCreated != 0 && uint32(message) == t.taskbarCreated:
		// Explorer restarted: the icon must be added again.
		t.add()
		return 0
	}
	r, _, _ := defWindowProc.Call(hwnd, message, wParam, lParam)
	return r
}
