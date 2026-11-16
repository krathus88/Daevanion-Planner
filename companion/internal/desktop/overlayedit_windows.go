package desktop

import "unsafe"

// Moving and resizing the shop panel and the soul popup (the settings
// window's Move and resize): while one is edited it shows a sample, takes the
// mouse (it is click-through otherwise) and has a frame; dragging it moves it,
// dragging its edges resizes it (placement.go). Each change is sent to main
// as a Choice when the mouse is let go. All on the tray's thread.

var (
	setWindowLongPtr = user32.NewProc("SetWindowLongPtrW")
	getCursorPos     = user32.NewProc("GetCursorPos")
)

// Where the shop panel and the soul popup sit, set by Tray.SetPlacements
// and, while dragging, the edit.
var (
	shopPlacement = DefaultPlacement()
	soulPlacement = DefaultPlacement()
)

// The overlay being moved and resized.
const (
	editNone = iota
	editShop
	editSoul
)

var editing = editNone

const (
	gwlExStyle = ^uintptr(19) // GWL_EXSTYLE, -20
	// wmPlacement (WM_APP + 7): Tray.SetPlacements handed new placements.
	wmPlacement        = 0x8000 + 7
	wmCaptureChanged   = 0x0215
	wmLButtonUpOverlay = 0x0202
	// The background is at least this opaque while edited (percent), so the
	// whole overlay takes the mouse: fully see-through pixels let it through.
	editOpacity = 70
	// How near an edge (unscaled pixels) grabs it.
	editGrab = 10
	// The frame's color (BGR), the settings window's accent.
	colorEditFrame = 0xf0a85b // #5ba8f0
	idcSizeAll     = 32646
	idcSizeNWSE    = 32642
	idcSizeNESW    = 32643
	idcSizeWE      = 32644
	idcSizeNS      = 32645
	nullBrush      = 5
)

// editable is an overlay that can be moved and resized.
type editable interface {
	hwnd() uintptr
	which() int
	placement() *Placement
	maxRows() int
	// Where it is on screen now.
	bounds() rect
	// The monitor's scale.
	dpiScale() float64
	rowStep() int32
	// layout sizes it for its placement and returns the size; put places
	// and draws it.
	layout() (w, h int32)
	put()
	command() Command
}

type shopEditable struct{ p *shopPanel }

func (e shopEditable) hwnd() uintptr         { return e.p.hwnd }
func (e shopEditable) which() int            { return editShop }
func (e shopEditable) placement() *Placement { return &shopPlacement }
func (e shopEditable) maxRows() int          { return ShopMaxRows }
func (e shopEditable) bounds() rect {
	return rect{Left: e.p.x, Top: e.p.y, Right: e.p.x + e.p.w, Bottom: e.p.y + e.p.h}
}
func (e shopEditable) dpiScale() float64 { return e.p.dpi }
func (e shopEditable) rowStep() int32    { return e.p.rowStep() }
func (e shopEditable) layout() (int32, int32) {
	e.p.layout()
	return e.p.w, e.p.h
}
func (e shopEditable) put() {
	e.p.put()
	// The soul popup stacks on it.
	placeSoulPopup()
}
func (e shopEditable) command() Command { return CommandShopPlacement }

type soulEditable struct{ s *soulPopup }

func (e soulEditable) hwnd() uintptr         { return e.s.hwnd }
func (e soulEditable) which() int            { return editSoul }
func (e soulEditable) placement() *Placement { return &soulPlacement }
func (e soulEditable) maxRows() int          { return SoulMaxRows }
func (e soulEditable) bounds() rect {
	return rect{Left: e.s.x, Top: e.s.y, Right: e.s.x + e.s.w, Bottom: e.s.y + e.s.h}
}
func (e soulEditable) dpiScale() float64 { return e.s.dpi }
func (e soulEditable) rowStep() int32    { return e.s.rowStep() }
func (e soulEditable) layout() (int32, int32) {
	e.s.layout()
	return e.s.w, e.s.h
}
func (e soulEditable) put()             { e.s.put() }
func (e soulEditable) command() Command { return CommandSoulPlacement }

// editableOf is the overlay to edit, or nil when it isn't there.
func editableOf(which int) editable {
	switch which {
	case editShop:
		if p := currentShopPanel; p != nil {
			return shopEditable{p}
		}
	case editSoul:
		if s := currentSoulPopup; s != nil {
			return soulEditable{s}
		}
	}
	return nil
}

// redisplayOverlay draws an overlay again with what it shows now.
func redisplayOverlay(which int) {
	switch which {
	case editShop:
		if p := currentShopPanel; p != nil {
			p.redisplay()
		}
	case editSoul:
		if s := currentSoulPopup; s != nil {
			s.redisplay()
		}
	}
}

// startEditing makes an overlay movable and resizable, with a sample in it;
// one at a time.
func startEditing(which int) {
	if editing == which {
		return
	}
	stopEditing()
	e := editableOf(which)
	if e == nil {
		return
	}
	editing = which
	setWindowLongPtr.Call(e.hwnd(), gwlExStyle, wsExTopmost|wsExToolWindow|wsExLayered|wsExNoActivate)
	redisplayOverlay(which)
}

// stopEditing makes the edited overlay click-through again, showing what it
// showed before.
func stopEditing() {
	if editing == editNone {
		return
	}
	which := editing
	editing = editNone
	drag = overlayDrag{}
	if e := editableOf(which); e != nil {
		setWindowLongPtr.Call(e.hwnd(), gwlExStyle, wsExTopmost|wsExTransparent|wsExToolWindow|wsExLayered|wsExNoActivate)
	}
	redisplayOverlay(which)
}

// editedBackground is an overlay's background opacity (0-255): at least
// editOpacity while it's the one edited.
func editedBackground(which int, background byte) byte {
	if editing == which {
		return max(background, OpacityByte(editOpacity))
	}
	return background
}

// drawEditFrame outlines an edited overlay in the accent color.
func drawEditFrame(dc uintptr, client rect, radius int32, dpi float64) {
	width := max(1, int32(2*dpi+0.5))
	pen, _, _ := createPen.Call(psSolid, uintptr(width), colorEditFrame)
	brush, _, _ := getStockObject.Call(nullBrush)
	oldPen, _, _ := selectObject.Call(dc, pen)
	oldBrush, _, _ := selectObject.Call(dc, brush)
	inset := width / 2
	roundRect.Call(dc, uintptr(inset), uintptr(inset), uintptr(client.Right-inset+1), uintptr(client.Bottom-inset+1), uintptr(radius), uintptr(radius))
	selectObject.Call(dc, oldPen)
	selectObject.Call(dc, oldBrush)
	deleteObject.Call(pen)
}

// overlayDrag is a move or resize under way.
type overlayDrag struct {
	active bool
	which  int
	// The edges dragged (none: a move), where the mouse and the overlay
	// were, and the placement then.
	edges  int
	mouse  point
	bounds rect
	start  Placement
}

var drag overlayDrag

// cursorPos is where the mouse is on screen (a variable for tests).
var cursorPos = func() point {
	var at point
	getCursorPos.Call(uintptr(unsafe.Pointer(&at)))
	return at
}

// grabbed is which edges the mouse is on.
func grabbed(e editable) int {
	at, b := cursorPos(), e.bounds()
	return grab(at.X-b.Left, at.Y-b.Top, b.Right-b.Left, b.Bottom-b.Top, int32(editGrab*e.dpiScale()+0.5))
}

// edgeCursor is the cursor for dragging these edges.
func edgeCursor(edges int) uintptr {
	switch edges {
	case 0:
		return idcSizeAll
	case edgeLeft | edgeTop, edgeRight | edgeBottom:
		return idcSizeNWSE
	case edgeRight | edgeTop, edgeLeft | edgeBottom:
		return idcSizeNESW
	case edgeLeft, edgeRight:
		return idcSizeWE
	default:
		return idcSizeNS
	}
}

// editMouse handles the mouse over an edited overlay; false when it isn't
// edited (or the message isn't the mouse's).
func editMouse(e editable, message uintptr) (uintptr, bool) {
	if editing != e.which() {
		return 0, false
	}
	switch message {
	case wmSetCursor:
		edges := grabbed(e)
		if drag.active {
			edges = drag.edges
		}
		cursor, _, _ := loadCursor.Call(0, edgeCursor(edges))
		setCursor.Call(cursor)
		return 1, true
	case wmLButtonDown:
		drag = overlayDrag{active: true, which: e.which(), edges: grabbed(e), mouse: cursorPos(), bounds: e.bounds(), start: *e.placement()}
		setCapture.Call(e.hwnd())
		return 0, true
	case wmMouseMove:
		if drag.active && drag.which == e.which() {
			dragTo(e, cursorPos())
		}
		return 0, true
	case wmLButtonUpOverlay:
		if drag.active {
			drag.active = false
			releaseCapture.Call()
			if current != nil {
				current.on(Choice{Command: e.command(), Placement: *e.placement()})
			}
		}
		return 0, true
	case wmCaptureChanged:
		drag.active = false
		return 0, true
	}
	return 0, false
}

// dragTo moves or resizes the edited overlay for the mouse at, keeping the
// edges not dragged where they were.
func dragTo(e editable, at point) {
	dx, dy := at.X-drag.mouse.X, at.Y-drag.mouse.Y
	b := drag.bounds
	area, _ := overlayArea(e.dpiScale())
	p := e.placement()
	if drag.edges == 0 {
		p.X, p.Y = anchorAt(b.Right+dx, b.Bottom+dy, area)
		*p = p.Clean(e.maxRows())
		e.layout()
		e.put()
		return
	}
	resizedTo := resized(drag.start, drag.edges, dx, dy, b.Right-b.Left, b.Bottom-b.Top, e.rowStep(), e.maxRows())
	p.Zoom, p.Rows = resizedTo.Zoom, resizedTo.Rows
	w, h := e.layout()
	right, bottom := b.Right, b.Bottom
	if drag.edges&edgeRight != 0 {
		right = b.Left + w
	}
	if drag.edges&edgeBottom != 0 {
		bottom = b.Top + h
	}
	p.X, p.Y = anchorAt(right, bottom, area)
	e.put()
}
