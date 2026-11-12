// Package desktop is the companion's Windows shell side: the notification
// area (tray) icon and its menu, starting with Windows, message boxes and
// running only once.
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
	createPopupMenu       = user32.NewProc("CreatePopupMenu")
	appendMenu            = user32.NewProc("AppendMenuW")
	trackPopupMenu        = user32.NewProc("TrackPopupMenu")
	destroyMenu           = user32.NewProc("DestroyMenu")
	setForegroundWindow   = user32.NewProc("SetForegroundWindow")
	getCursorPos          = user32.NewProc("GetCursorPos")
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

	mfString    = 0x0000
	mfGrayed    = 0x0001
	mfChecked   = 0x0008
	mfSeparator = 0x0800

	tpmRightButton = 0x0002
	tpmReturnCmd   = 0x0100

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

// Command is a menu choice.
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
)

// Menu is what the tray menu shows; the tray asks for it each time it opens.
type Menu struct {
	// A first, greyed line: what the companion is doing.
	Status   string
	LoggedIn bool
	// Who is logged in, for "Log out (name)".
	Account string
	// Whether it starts with Windows; StartupAvailable is false when it
	// runs from `go run`, whose .exe is temporary.
	Startup          bool
	StartupAvailable bool
	// Whether the game's messages are being recorded.
	Recording bool
}

// Tray is the notification area icon.
type Tray struct {
	hwnd           uintptr
	icon           uintptr
	taskbarCreated uint32
	menu           func() Menu
	on             func(Command)
	done           chan struct{}

	mu  sync.Mutex
	tip string
	// The widget's state, handed to the tray's thread.
	widgetState WidgetState
	widgetText  string
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

// NewTray adds the icon. menu is called for the menu's content and on for
// each choice, both on the tray's own thread: keep them quick.
func NewTray(tip string, menu func() Menu, on func(Command)) (*Tray, error) {
	if current != nil {
		return nil, errors.New("the tray icon is already shown")
	}
	t := &Tray{menu: menu, on: on, tip: tip, done: make(chan struct{})}
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
	ready <- nil

	var m msg
	for {
		r, _, _ := getMessage.Call(uintptr(unsafe.Pointer(&m)), 0, 0, 0)
		if r == 0 || int32(r) == -1 {
			return
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

// Close removes the icon and waits for its thread to end.
func (t *Tray) Close() {
	postMessage.Call(t.hwnd, wmClose, 0, 0)
	<-t.done
}

func (t *Tray) showMenu() {
	state := t.menu()
	menu, _, _ := createPopupMenu.Call()
	if menu == 0 {
		return
	}
	defer destroyMenu.Call(menu)
	add := func(flags uint32, id Command, text string) {
		appendMenu.Call(menu, uintptr(flags), uintptr(id), uintptr(unsafe.Pointer(wide(text))))
	}

	if state.Status != "" {
		add(mfString|mfGrayed, CommandNone, state.Status)
		add(mfSeparator, CommandNone, "")
	}
	if state.LoggedIn {
		label := "Log out"
		if state.Account != "" {
			label += " (" + state.Account + ")"
		}
		add(mfString, CommandLogOut, label)
	} else {
		add(mfString, CommandLogIn, "Log in with Discord")
	}
	startup := uint32(mfString)
	if state.Startup {
		startup |= mfChecked
	}
	if !state.StartupAvailable {
		startup |= mfGrayed
	}
	add(startup, CommandStartup, "Start with Windows")
	add(mfString, CommandOpenLog, "Open log")
	add(mfSeparator, CommandNone, "")
	record := uint32(mfString)
	if state.Recording {
		record |= mfChecked
	}
	add(record, CommandRecord, "Record game data")
	add(mfString, CommandOpenRecordings, "Open recordings")
	add(mfSeparator, CommandNone, "")
	add(mfString, CommandExit, "Exit")

	var p point
	getCursorPos.Call(uintptr(unsafe.Pointer(&p)))
	// Without this the menu stays open when clicking elsewhere.
	setForegroundWindow.Call(t.hwnd)
	chosen, _, _ := trackPopupMenu.Call(menu, tpmRightButton|tpmReturnCmd, uintptr(p.X), uintptr(p.Y), 0, t.hwnd, 0)
	postMessage.Call(t.hwnd, wmNull, 0, 0)
	if Command(chosen) != CommandNone {
		t.on(Command(chosen))
	}
}

func windowProc(hwnd, message, wParam, lParam uintptr) uintptr {
	t := current
	switch {
	case t == nil:
	case message == wmTrayIcon:
		switch lParam & 0xffff {
		case wmLButtonUp, wmRButtonUp:
			t.showMenu()
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
	case message == wmClose:
		if currentWidget != nil {
			destroyWindow.Call(currentWidget.hwnd)
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
