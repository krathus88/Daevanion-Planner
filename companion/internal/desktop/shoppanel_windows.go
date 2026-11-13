package desktop

import (
	"image"
	"syscall"
	"unsafe"
)

// The shop panel: while a shop tab selling pets is open, a column in the
// game window's bottom right corner (growing upward) listing the pets the
// user's filters let through: portrait, souls to Insight Lv3, and tags for
// the continents they spawn on. Click-through like the widget, on the tray's
// thread; an overlay (overlay_windows.go).

// ShopView is what the shop panel shows: pets, or Empty when none is left
// to show.
type ShopView struct {
	Pets  []ShopPet
	Empty string
}

// ShopPet is one pet in the shop panel.
type ShopPet struct {
	Name string
	// Its portrait; nil draws an empty square.
	Icon image.Image
	// Its Insight level (0 locked, 3 shown muted), negative when unknown,
	// and its souls toward the next level.
	Level int
	Souls int
	// This entry was bought: drawn faded, "✓ Bought" in place of its level.
	Bought bool
	// verteron, reshanta, altgard; empty: not in the wild.
	Maps []string
}

var (
	msimg32 = syscall.NewLazyDLL("msimg32.dll")

	clientToScreen     = user32.NewProc("ClientToScreen")
	roundRect          = gdi32.NewProc("RoundRect")
	createDIBSection   = gdi32.NewProc("CreateDIBSection")
	createCompatibleDC = gdi32.NewProc("CreateCompatibleDC")
	deleteDC           = gdi32.NewProc("DeleteDC")
	alphaBlend         = msimg32.NewProc("AlphaBlend")
)

// bitmapInfo is a BITMAPINFOHEADER (no color table: 32 bits per pixel).
type bitmapInfo struct {
	Size          uint32
	Width, Height int32
	Planes, Bits  uint16
	Compression   uint32
	SizeImage     uint32
	XPels, YPels  int32
	Used          uint32
	Important     uint32
}

// drawPixels draws premultiplied BGRA rows (iconPixels) at x, y, blending
// by their alpha.
func drawPixels(dc uintptr, x, y, size int32, pixels []byte) {
	info := bitmapInfo{Size: 40, Width: size, Height: -size, Planes: 1, Bits: 32}
	var bits unsafe.Pointer
	bitmap, _, _ := createDIBSection.Call(dc, uintptr(unsafe.Pointer(&info)), 0, uintptr(unsafe.Pointer(&bits)), 0, 0)
	if bitmap == 0 || bits == nil {
		return
	}
	defer deleteObject.Call(bitmap)
	copy(unsafe.Slice((*byte)(bits), len(pixels)), pixels)
	memory, _, _ := createCompatibleDC.Call(dc)
	defer deleteDC.Call(memory)
	old, _, _ := selectObject.Call(memory, bitmap)
	defer selectObject.Call(memory, old)
	// BLENDFUNCTION{AC_SRC_OVER, 0, 255, AC_SRC_ALPHA}, passed by value.
	const blend = 0x01ff0000
	alphaBlend.Call(dc, uintptr(x), uintptr(y), uintptr(size), uintptr(size), memory, 0, 0, uintptr(size), uintptr(size), blend)
}

const (
	wmShopPanel = 0x8000 + 3 // WM_APP + 3: the shop panel's pets changed
	fwSemibold  = 600
	dtCenter    = 0x0001
	dtRight     = 0x0002
	colorMuted  = 0xb7a8a4 // #a4a8b7
	colorTagInk = 0x30221d // the panel's background, as tag text
	colorIconBg = 0x3d2c26 // #262c3d, an empty portrait
)

// Tag colors (BGR), one per continent and one for pets not in the wild.
var tagColors = map[string]uintptr{
	"verteron": 0x9ad35f, // #5fd39a green
	"reshanta": 0xf08cb4, // #b48cf0 purple
	"altgard":  0xf0a85b, // #5ba8f0 blue
	"":         0x6c8af0, // #f08a6c coral
}

var tagNames = map[string]string{
	"verteron": "Verteron",
	"reshanta": "Lower Reshanta",
	"altgard":  "Altgard",
	"":         "Not in the wild",
}

type shopPanel struct {
	hwnd     uintptr
	scale    float64
	nameFont uintptr
	tagFont  uintptr
	// What main asked for last (nil: hidden), and the opacity preview's
	// sample shown over it meanwhile.
	view    *ShopView
	preview *ShopView
	// Where it sits, in screen pixels.
	x, y, w, h int32
	// Rows laid out for painting, in window pixels.
	rows []panelRow
	// Portraits shrunk for the current scale.
	icons map[iconKey][]byte
}

type iconKey struct {
	icon image.Image
	size int32
}

type panelRow struct {
	// A pet row has a portrait column (pet true, icon nil when none).
	pet  bool
	icon image.Image
	text string
	// The level (in its color) and souls toward the next level, at the right.
	level      string
	levelColor uintptr
	progress   string
	// A bought entry: all but its "✓ Bought" is faded.
	bought bool
	tags   []string
	top    int32
	muted  bool
}

var currentShopPanel *shopPanel

func (p *shopPanel) px(v int) int32 {
	return int32(float64(v)*p.scale + 0.5)
}

func newShopPanel(instance uintptr) *shopPanel {
	p := &shopPanel{scale: 1}
	className := wide("DaevanionCompanionShopPanel")
	class := wndClassEx{
		WndProc:   syscall.NewCallback(shopPanelProc),
		Instance:  instance,
		ClassName: className,
	}
	class.Size = uint32(unsafe.Sizeof(class))
	if r, _, _ := registerClassEx.Call(uintptr(unsafe.Pointer(&class))); r == 0 {
		return nil
	}
	style := uintptr(wsExTopmost | wsExTransparent | wsExToolWindow | wsExLayered | wsExNoActivate)
	p.hwnd, _, _ = createWindowEx.Call(style, uintptr(unsafe.Pointer(className)), uintptr(unsafe.Pointer(wide("Daevanion Companion shop"))), wsPopup, 0, 0, 0, 0, 0, 0, instance, 0)
	if p.hwnd == 0 {
		return nil
	}
	p.makeFonts()
	currentShopPanel = p
	return p
}

func (p *shopPanel) makeFonts() {
	for _, font := range []uintptr{p.nameFont, p.tagFont} {
		if font != 0 {
			deleteObject.Call(font)
		}
	}
	segoe := uintptr(unsafe.Pointer(wide("Segoe UI")))
	p.nameFont, _, _ = createFont.Call(uintptr(-p.px(15)), 0, 0, 0, fwNormal, 0, 0, 0, 1, 0, 0, antialiasedQuality, 0, segoe)
	p.tagFont, _, _ = createFont.Call(uintptr(-p.px(12)), 0, 0, 0, fwSemibold, 0, 0, 0, 1, 0, 0, antialiasedQuality, 0, segoe)
}

func (p *shopPanel) measure(font uintptr, text string) int32 {
	dc, _, _ := getDC.Call(p.hwnd)
	defer releaseDC.Call(p.hwnd, dc)
	old, _, _ := selectObject.Call(dc, font)
	defer selectObject.Call(dc, old)
	r := rect{}
	drawText.Call(dc, uintptr(unsafe.Pointer(wide(text))), ^uintptr(0), uintptr(unsafe.Pointer(&r)), dtCalcRect|dtSingleLine|dtNoPrefix)
	return r.Right - r.Left
}

// Sizes, unscaled.
const (
	panelPad     = 12
	panelLine    = 22
	panelTag     = 20
	panelTagPadX = 7
	panelTagGap  = 6
	panelPetGap  = 8
	panelInset   = 16
	// How far above the game window's bottom the panel ends, clear of the
	// shop's Purchase bar (user's pick; the corner widget stays in the corner).
	panelLift    = 200
	panelIcon    = 40
	panelIconGap = 10
	panelIconR   = 8
)

// boughtFade is how strongly a bought entry is drawn (0-1).
const boughtFade = 0.4

// boughtRects are the bought entries' areas to fade: the name line up to
// "✓ Bought", and the tags line and portrait whole. Rows must be laid out
// for the current width.
func (p *shopPanel) boughtRects() []fadeRect {
	var out []fadeRect
	left, right := p.px(panelPad), p.w-p.px(panelPad)
	for _, row := range p.rows {
		if !row.bought {
			continue
		}
		line := row.top + p.px(panelLine)
		block := line + p.px(4) + p.px(panelTag)
		badge := right - p.rightWidth(row.level, row.progress) - p.px(panelBadgeGap)
		out = append(out,
			fadeRect{left, row.top, badge, line, boughtFade},
			fadeRect{left, line, right, block, boughtFade})
	}
	return out
}

// The gap between a pet's level and its souls.
const panelBadgeGap = 6

// rightWidth is how wide a pet's level and souls are drawn.
func (p *shopPanel) rightWidth(level, progress string) int32 {
	w := p.measure(p.tagFont, level)
	if progress != "" {
		w += p.px(panelBadgeGap) + p.measure(p.nameFont, progress)
	}
	return w
}

// iconPixels for the current scale, shrunk once.
func (p *shopPanel) iconPixels(icon image.Image) []byte {
	key := iconKey{icon, p.px(panelIcon)}
	if px, ok := p.icons[key]; ok {
		return px
	}
	if p.icons == nil {
		p.icons = map[iconKey][]byte{}
	}
	px := iconPixels(icon, int(key.size), int(p.px(panelIconR)))
	p.icons[key] = px
	return px
}

func (p *shopPanel) tagWidth(tag string) int32 {
	return p.measure(p.tagFont, tagNames[tag]) + 2*p.px(panelTagPadX)
}

// show takes what main wants shown (nil hides the panel).
func (p *shopPanel) show(view *ShopView) {
	p.view = view
	if p.preview == nil {
		p.display(view)
	}
}

// startPreview shows the sample over whatever is shown, until endPreview;
// called again, it redraws at the new opacity.
func (p *shopPanel) startPreview(sample *ShopView) {
	p.preview = sample
	p.display(sample)
}

func (p *shopPanel) endPreview() {
	if p.preview == nil {
		return
	}
	p.preview = nil
	p.display(p.view)
}

// display lays a view out and puts the panel up, or hides it for nil.
func (p *shopPanel) display(view *ShopView) {
	if view == nil {
		showWindow.Call(p.hwnd, swHide)
		return
	}
	pets := view.Pets

	// The game window's client area (the monitor's work area without it),
	// at its monitor's scale.
	game := gameWindow()
	var monitor uintptr
	if game != 0 {
		monitor, _, _ = monitorFromWindow.Call(game, monitorDefaultToNearest)
	} else {
		monitor = widgetMonitor()
	}
	area, scale := workArea(monitor)
	if scale > 0 && scale != p.scale {
		p.scale = scale
		p.makeFonts()
	}
	// The corner widget's spot (widget.put) on that monitor: the panel stays
	// above it, so the two never overlap.
	widgetTop := area.Bottom - p.px(16) - p.px(36) - p.px(8)
	if game != 0 {
		var client rect
		getClientRect.Call(game, uintptr(unsafe.Pointer(&client)))
		corner := struct{ X, Y int32 }{client.Right, client.Bottom}
		clientToScreen.Call(game, uintptr(unsafe.Pointer(&corner)))
		area.Right, area.Bottom = corner.X, corner.Y
	}

	p.rows = p.rows[:0]
	top := p.px(panelPad)
	width := p.measure(p.nameFont, "Pets here")
	p.rows = append(p.rows, panelRow{text: "Pets here", top: top, muted: true})
	top += p.px(panelLine) + p.px(panelPetGap)
	if len(pets) == 0 {
		p.rows = append(p.rows, panelRow{text: view.Empty, top: top})
		width = max(width, p.measure(p.nameFont, view.Empty))
		top += p.px(panelLine)
	}
	for k, pet := range pets {
		level, levelColor, progress := levelText(pet.Level, pet.Souls)
		if pet.Bought {
			level, levelColor, progress = "✓ Bought", colorConnected, ""
		}
		tags := pet.Maps
		if len(tags) == 0 {
			tags = []string{""}
		}
		p.rows = append(p.rows, panelRow{pet: true, icon: pet.Icon, text: pet.Name, level: level, levelColor: levelColor, progress: progress, tags: tags, top: top, muted: pet.Level == 3 && !pet.Bought, bought: pet.Bought})
		column := p.px(panelIcon) + p.px(panelIconGap)
		width = max(width, column+p.measure(p.nameFont, pet.Name)+p.px(16)+p.rightWidth(level, progress))
		var tagsWidth int32
		for i, tag := range tags {
			if i > 0 {
				tagsWidth += p.px(panelTagGap)
			}
			tagsWidth += p.tagWidth(tag)
		}
		width = max(width, column+tagsWidth)
		top += p.px(panelLine) + p.px(4) + p.px(panelTag)
		if k < len(pets)-1 {
			top += p.px(panelPetGap) + p.px(4)
		}
	}
	p.w = width + 2*p.px(panelPad)
	p.h = top + p.px(panelPad)
	p.x = area.Right - p.w - p.px(panelInset)
	p.y = min(area.Bottom-p.px(panelInset)-p.px(panelLift), widgetTop) - p.h
	setWindowPos.Call(p.hwnd, hwndTopmost, uintptr(p.x), uintptr(p.y), uintptr(p.w), uintptr(p.h), swpNoActivate)
	renderOverlay(p.hwnd, p.x, p.y, p.w, p.h, p.px(12), 255, p.boughtRects(), p.draw)
	showWindow.Call(p.hwnd, swShowNoActivate)
}

func (p *shopPanel) draw(dc uintptr, client rect) {
	left := p.px(panelPad)
	right := client.Right - p.px(panelPad)
	oldFont, _, _ := selectObject.Call(dc, p.nameFont)
	pen, _, _ := getStockObject.Call(nullPen)
	oldPen, _, _ := selectObject.Call(dc, pen)
	for _, row := range p.rows {
		color := uintptr(colorText)
		if row.muted {
			color = colorMuted
		}
		textLeft := left
		if row.pet {
			size := p.px(panelIcon)
			// Centered on the name and tags.
			block := p.px(panelLine) + p.px(4) + p.px(panelTag)
			iconTop := row.top + (block-size)/2
			if row.icon != nil {
				drawPixels(dc, left, iconTop, size, p.iconPixels(row.icon))
			} else {
				brush, _, _ := createSolidBrush.Call(colorIconBg)
				oldBrush, _, _ := selectObject.Call(dc, brush)
				roundRect.Call(dc, uintptr(left), uintptr(iconTop), uintptr(left+size+1), uintptr(iconTop+size+1), uintptr(2*p.px(panelIconR)), uintptr(2*p.px(panelIconR)))
				selectObject.Call(dc, oldBrush)
				deleteObject.Call(brush)
			}
			textLeft = left + size + p.px(panelIconGap)
		}
		selectObject.Call(dc, p.nameFont)
		setTextColor.Call(dc, color)
		line := rect{Left: textLeft, Top: row.top, Right: right, Bottom: row.top + p.px(panelLine)}
		drawText.Call(dc, uintptr(unsafe.Pointer(wide(row.text))), ^uintptr(0), uintptr(unsafe.Pointer(&line)), dtLeft|dtVCenter|dtSingleLine|dtNoPrefix)
		if row.progress != "" {
			drawText.Call(dc, uintptr(unsafe.Pointer(wide(row.progress))), ^uintptr(0), uintptr(unsafe.Pointer(&line)), dtRight|dtVCenter|dtSingleLine|dtNoPrefix)
		}
		if row.level != "" {
			badge := line
			if row.progress != "" {
				badge.Right -= p.measure(p.nameFont, row.progress) + p.px(panelBadgeGap)
			}
			selectObject.Call(dc, p.tagFont)
			setTextColor.Call(dc, row.levelColor)
			drawText.Call(dc, uintptr(unsafe.Pointer(wide(row.level))), ^uintptr(0), uintptr(unsafe.Pointer(&badge)), dtRight|dtVCenter|dtSingleLine|dtNoPrefix)
		}

		x := textLeft
		tagTop := row.top + p.px(panelLine) + p.px(4)
		selectObject.Call(dc, p.tagFont)
		setTextColor.Call(dc, colorTagInk)
		for _, tag := range row.tags {
			w := p.tagWidth(tag)
			brush, _, _ := createSolidBrush.Call(tagColors[tag])
			oldBrush, _, _ := selectObject.Call(dc, brush)
			roundRect.Call(dc, uintptr(x), uintptr(tagTop), uintptr(x+w+1), uintptr(tagTop+p.px(panelTag)+1), uintptr(p.px(10)), uintptr(p.px(10)))
			selectObject.Call(dc, oldBrush)
			deleteObject.Call(brush)
			box := rect{Left: x, Top: tagTop, Right: x + w, Bottom: tagTop + p.px(panelTag)}
			drawText.Call(dc, uintptr(unsafe.Pointer(wide(tagNames[tag]))), ^uintptr(0), uintptr(unsafe.Pointer(&box)), dtCenter|dtVCenter|dtSingleLine|dtNoPrefix)
			x += w + p.px(panelTagGap)
		}
	}
	selectObject.Call(dc, oldPen)
	selectObject.Call(dc, oldFont)
}

func shopPanelProc(hwnd, message, wParam, lParam uintptr) uintptr {
	r, _, _ := defWindowProc.Call(hwnd, message, wParam, lParam)
	return r
}
