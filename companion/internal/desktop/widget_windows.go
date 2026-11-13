package desktop

import (
	"syscall"
	"unsafe"
)

// The widget: a small box in the bottom right corner of the monitor showing
// the game (the main one without it), above everything and
// letting clicks through, saying what the companion is up to (its game
// connection, an update). Some states stay up, others show for a moment and
// fade. It lives on the tray's thread.

// WidgetState picks the widget's dot and whether it stays.
type WidgetState int

const (
	// Amber, stays: e.g. not connected to the game.
	WidgetWaiting WidgetState = iota
	// Green, fades: connected, updated.
	WidgetDone
	// Blue, stays: updating.
	WidgetBusy
	// Not shown.
	WidgetHidden
)

func (s WidgetState) color() uintptr {
	switch s {
	case WidgetDone:
		return colorConnected
	case WidgetBusy:
		return colorBusy
	default:
		return colorNotConnected
	}
}

var (
	gdi32 = syscall.NewLazyDLL("gdi32.dll")

	showWindow             = user32.NewProc("ShowWindow")
	setWindowPos           = user32.NewProc("SetWindowPos")
	invalidateRect         = user32.NewProc("InvalidateRect")
	beginPaint             = user32.NewProc("BeginPaint")
	endPaint               = user32.NewProc("EndPaint")
	fillRect               = user32.NewProc("FillRect")
	drawText               = user32.NewProc("DrawTextW")
	getDC                  = user32.NewProc("GetDC")
	releaseDC              = user32.NewProc("ReleaseDC")
	setTimer               = user32.NewProc("SetTimer")
	killTimer              = user32.NewProc("KillTimer")
	systemParametersInfo   = user32.NewProc("SystemParametersInfoW")
	getDpiForSystem        = user32.NewProc("GetDpiForSystem")
	getClientRect          = user32.NewProc("GetClientRect")
	setDpiAwarenessContext = user32.NewProc("SetProcessDpiAwarenessContext")
	createSolidBrush       = gdi32.NewProc("CreateSolidBrush")
	createFont             = gdi32.NewProc("CreateFontW")
	selectObject           = gdi32.NewProc("SelectObject")
	deleteObject           = gdi32.NewProc("DeleteObject")
	setBkMode              = gdi32.NewProc("SetBkMode")
	setTextColor           = gdi32.NewProc("SetTextColor")
	ellipse                = gdi32.NewProc("Ellipse")
	getStockObject         = gdi32.NewProc("GetStockObject")
)

const (
	wsPopup            = 0x80000000
	wsExTopmost        = 0x00000008
	wsExTransparent    = 0x00000020
	wsExToolWindow     = 0x00000080
	wsExLayered        = 0x00080000
	wsExNoActivate     = 0x08000000
	swHide             = 0
	swShowNoActivate   = 4
	swpNoActivate      = 0x0010
	hwndTopmost        = ^uintptr(0) // (HWND)-1
	wmPaint            = 0x000F
	wmTimer            = 0x0113
	spiGetWorkArea     = 0x0030
	dtLeft             = 0x0000
	dtVCenter          = 0x0004
	dtSingleLine       = 0x0020
	dtCalcRect         = 0x0400
	dtNoPrefix         = 0x0800
	bkTransparent      = 1
	nullPen            = 8
	fwNormal           = 400
	antialiasedQuality = 4
	timerHold          = 1
	timerFade          = 2
	connectedHoldMs    = 3000
	fadeStepMs         = 30
	fadeStep           = 24
	wmWidget           = 0x8000 + 2  // WM_APP + 2: the widget's state changed
	dpiPerMonitorV2    = ^uintptr(3) // DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2 (-4)
	colorBackground    = 0x30221d    // BGR of #1d2230, the site's dark panel
	colorText          = 0xf1ebe9    // #e9ebf1
	colorConnected     = 0x9ad35f    // #5fd39a
	colorNotConnected  = 0x50b4e6    // #e6b450
	colorBusy          = 0xf0a85b    // #5ba8f0
)

type rect struct{ Left, Top, Right, Bottom int32 }

type paintStruct struct {
	HDC         uintptr
	Erase       int32
	Paint       rect
	Restore     int32
	IncUpdate   int32
	RGBReserved [32]byte
}

type widget struct {
	hwnd  uintptr
	font  uintptr
	scale float64
	state WidgetState
	text  string
	alpha int
	// Where it sits, in screen pixels.
	x, y, w, h int32
	// A sample shown by the settings window's opacity preview; what show
	// asks for meanwhile waits in state and text.
	preview string
}

// One widget per process, like the tray.
var currentWidget *widget

// WidgetError says why the widget couldn't be made, if it couldn't.
var WidgetError error

func (w *widget) px(v int) int32 {
	return int32(float64(v)*w.scale + 0.5)
}

// newWidget makes the (hidden) window on the calling thread.
func newWidget(instance uintptr) *widget {
	dpi, _, _ := getDpiForSystem.Call()
	if dpi == 0 {
		dpi = 96
	}
	w := &widget{scale: float64(dpi) / 96}
	className := wide("DaevanionCompanionWidget")
	class := wndClassEx{
		WndProc:   syscall.NewCallback(widgetProc),
		Instance:  instance,
		ClassName: className,
	}
	class.Size = uint32(unsafe.Sizeof(class))
	if r, _, err := registerClassEx.Call(uintptr(unsafe.Pointer(&class))); r == 0 {
		WidgetError = err
		return nil
	}
	style := uintptr(wsExTopmost | wsExTransparent | wsExToolWindow | wsExLayered | wsExNoActivate)
	var err error
	w.hwnd, _, err = createWindowEx.Call(style, uintptr(unsafe.Pointer(className)), uintptr(unsafe.Pointer(wide("Daevanion Companion"))), wsPopup, 0, 0, 0, 0, 0, 0, instance, 0)
	if w.hwnd == 0 {
		WidgetError = err
		return nil
	}
	w.makeFont()
	currentWidget = w
	return w
}

// makeFont (re)makes the font at the widget's scale.
func (w *widget) makeFont() {
	if w.font != 0 {
		deleteObject.Call(w.font)
	}
	// Grayscale smoothing, not ClearType: ClearType's colored edges look
	// blurry on the dark box, and wrong on OLED and other panels whose
	// subpixels aren't in RGB stripes.
	w.font, _, _ = createFont.Call(uintptr(-w.px(15)), 0, 0, 0, fwNormal, 0, 0, 0, 1, 0, 0, antialiasedQuality, 0, uintptr(unsafe.Pointer(wide("Segoe UI"))))
}

// textWidth measures the text in the widget's font.
func (w *widget) textWidth(text string) int32 {
	dc, _, _ := getDC.Call(w.hwnd)
	defer releaseDC.Call(w.hwnd, dc)
	old, _, _ := selectObject.Call(dc, w.font)
	defer selectObject.Call(dc, old)
	r := rect{}
	drawText.Call(dc, uintptr(unsafe.Pointer(wide(text))), ^uintptr(0), uintptr(unsafe.Pointer(&r)), dtCalcRect|dtSingleLine|dtNoPrefix)
	return r.Right - r.Left
}

// show puts the widget up in the corner; a done state fades out after a
// moment.
func (w *widget) show(state WidgetState, text string) {
	if state == w.state && text == w.text {
		return
	}
	w.state = state
	w.text = text
	if w.preview == "" {
		w.apply()
	}
}

// apply shows the state asked for last.
func (w *widget) apply() {
	killTimer.Call(w.hwnd, timerHold)
	killTimer.Call(w.hwnd, timerFade)
	if w.state == WidgetHidden {
		w.alpha = 0
		showWindow.Call(w.hwnd, swHide)
		return
	}
	w.put(w.text)
	if w.state == WidgetDone {
		setTimer.Call(w.hwnd, timerHold, connectedHoldMs, 0)
	}
}

// put places the box for text in the corner and shows it at full strength.
func (w *widget) put(text string) {
	// Monitors can have different scales: size the box for the one it goes on.
	area, scale := workArea(widgetMonitor())
	if scale > 0 && scale != w.scale {
		w.scale = scale
		w.makeFont()
	}
	w.w = w.px(16) + w.px(8) + w.px(10) + w.textWidth(text) + w.px(16)
	w.h = w.px(36)
	w.x = area.Right - w.w - w.px(16)
	w.y = area.Bottom - w.h - w.px(16)
	setWindowPos.Call(w.hwnd, hwndTopmost, uintptr(w.x), uintptr(w.y), uintptr(w.w), uintptr(w.h), swpNoActivate)
	w.alpha = 255
	w.render()
	showWindow.Call(w.hwnd, swShowNoActivate)
}

// render draws the box at its current fade.
func (w *widget) render() {
	text, state := w.text, w.state
	if w.preview != "" {
		text, state = w.preview, WidgetDone
	}
	renderOverlay(w.hwnd, w.x, w.y, w.w, w.h, w.px(10), byte(max(0, min(255, w.alpha))), nil, func(dc uintptr, client rect) {
		dot, _, _ := createSolidBrush.Call(state.color())
		oldBrush, _, _ := selectObject.Call(dc, dot)
		pen, _, _ := getStockObject.Call(nullPen)
		oldPen, _, _ := selectObject.Call(dc, pen)
		middle := (client.Bottom - client.Top) / 2
		size := w.px(8)
		left := w.px(16)
		ellipse.Call(dc, uintptr(left), uintptr(middle-size/2), uintptr(left+size+1), uintptr(middle+size/2+1))
		selectObject.Call(dc, oldPen)
		selectObject.Call(dc, oldBrush)
		deleteObject.Call(dot)

		oldFont, _, _ := selectObject.Call(dc, w.font)
		setTextColor.Call(dc, colorText)
		textRect := rect{Left: left + size + w.px(10), Top: 0, Right: client.Right, Bottom: client.Bottom}
		drawText.Call(dc, uintptr(unsafe.Pointer(wide(text))), ^uintptr(0), uintptr(unsafe.Pointer(&textRect)), dtLeft|dtVCenter|dtSingleLine|dtNoPrefix)
		selectObject.Call(dc, oldFont)
	})
}

// startPreview shows text in the box, held, until endPreview.
func (w *widget) startPreview(text string) {
	killTimer.Call(w.hwnd, timerHold)
	killTimer.Call(w.hwnd, timerFade)
	w.preview = text
	w.put(text)
}

// endPreview puts back what was asked for meanwhile.
func (w *widget) endPreview() {
	if w.preview == "" {
		return
	}
	w.preview = ""
	w.apply()
}

func (w *widget) tick(id uintptr) {
	switch id {
	case timerHold:
		killTimer.Call(w.hwnd, timerHold)
		setTimer.Call(w.hwnd, timerFade, fadeStepMs, 0)
	case timerFade:
		w.alpha -= fadeStep
		if w.alpha <= 0 {
			w.alpha = 0
			killTimer.Call(w.hwnd, timerFade)
			showWindow.Call(w.hwnd, swHide)
			return
		}
		w.render()
	}
}

func widgetProc(hwnd, message, wParam, lParam uintptr) uintptr {
	w := currentWidget
	if w != nil && hwnd == w.hwnd {
		switch message {
		case wmTimer:
			w.tick(wParam)
			return 0
		}
	}
	r, _, _ := defWindowProc.Call(hwnd, message, wParam, lParam)
	return r
}

// makeDPIAware keeps the widget and menus sharp on scaled displays (Windows
// 10 1703 and later; older ones keep the blurry scaling).
func makeDPIAware() {
	if setDpiAwarenessContext.Find() == nil {
		setDpiAwarenessContext.Call(dpiPerMonitorV2)
	}
}
