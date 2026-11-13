package desktop

import "unsafe"

// Overlays (the corner widget and the shop panel) are layered windows drawn
// pixel by pixel: their background takes the user's opacity while text, tags
// and portraits stay solid. Both live on the tray's thread.

var (
	updateLayeredWindow = user32.NewProc("UpdateLayeredWindow")
	gdiFlush            = gdi32.NewProc("GdiFlush")
)

const ulwAlpha = 2

// DefaultOverlayOpacity is the overlays' background opacity, in percent,
// unless set otherwise.
const DefaultOverlayOpacity = 0

// overlayBackground is the overlays' background opacity (0-255), set by
// Tray.SetOverlayOpacity and, while previewing, the settings window.
var overlayBackground = OpacityByte(DefaultOverlayOpacity)

// renderOverlay draws a w x h overlay at x, y: draw's content over the
// background at the user's opacity, with rounded corners; fade (0-255) dims
// the whole window, and each of fades draws the content inside it fainter
// (the background stays). The content is drawn twice, on black and on white, so
// composeOverlay can tell how see-through each pixel is.
func renderOverlay(hwnd uintptr, x, y, w, h, radius int32, fade byte, fades []fadeRect, draw func(dc uintptr, client rect)) {
	if w <= 0 || h <= 0 {
		return
	}
	screen, _, _ := getDC.Call(0)
	defer releaseDC.Call(0, screen)
	client := rect{Right: w, Bottom: h}
	// drawOn draws the content on a solid color into a new DC; done frees it.
	drawOn := func(color uintptr) (dc uintptr, pixels []byte, done func()) {
		dc, _, _ = createCompatibleDC.Call(screen)
		info := bitmapInfo{Size: 40, Width: w, Height: -h, Planes: 1, Bits: 32}
		var bits unsafe.Pointer
		bitmap, _, _ := createDIBSection.Call(dc, uintptr(unsafe.Pointer(&info)), 0, uintptr(unsafe.Pointer(&bits)), 0, 0)
		if bitmap == 0 || bits == nil {
			deleteDC.Call(dc)
			return 0, nil, nil
		}
		old, _, _ := selectObject.Call(dc, bitmap)
		brush, _, _ := createSolidBrush.Call(color)
		fillRect.Call(dc, uintptr(unsafe.Pointer(&client)), brush)
		deleteObject.Call(brush)
		setBkMode.Call(dc, bkTransparent)
		draw(dc, client)
		gdiFlush.Call()
		return dc, unsafe.Slice((*byte)(bits), int(w)*int(h)*4), func() {
			selectObject.Call(dc, old)
			deleteObject.Call(bitmap)
			deleteDC.Call(dc)
		}
	}
	dc, black, done := drawOn(0x000000)
	if done == nil {
		return
	}
	defer done()
	_, white, doneWhite := drawOn(0xffffff)
	if doneWhite == nil {
		return
	}
	defer doneWhite()
	composeOverlay(black, white, int(w), int(h), int(radius), colorBackground, overlayBackground, fades)

	at := point{X: x, Y: y}
	size := struct{ CX, CY int32 }{w, h}
	source := point{}
	// BLENDFUNCTION{AC_SRC_OVER, 0, fade, AC_SRC_ALPHA}.
	blend := [4]byte{0, 0, fade, 1}
	updateLayeredWindow.Call(hwnd, screen, uintptr(unsafe.Pointer(&at)), uintptr(unsafe.Pointer(&size)), dc, uintptr(unsafe.Pointer(&source)), 0, uintptr(unsafe.Pointer(&blend)), ulwAlpha)
}

// wmOverlay (WM_APP + 5) carries a new opacity, in percent, in wParam.
const wmOverlay = 0x8000 + 5

// redrawOverlays draws the shown overlays again (after an opacity change).
func redrawOverlays() {
	if w := currentWidget; w != nil {
		if visible, _, _ := isWindowVisible.Call(w.hwnd); visible != 0 {
			w.render()
		}
	}
	if p := currentShopPanel; p != nil {
		if visible, _, _ := isWindowVisible.Call(p.hwnd); visible != 0 {
			if p.preview != nil {
				p.display(p.preview)
			} else {
				p.display(p.view)
			}
		}
	}
}
