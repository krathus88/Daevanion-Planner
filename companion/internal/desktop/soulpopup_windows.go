package desktop

import (
	"image"
	"strconv"
	"syscall"
	"unsafe"
)

// The soul popup: a pet gained souls, so a column on the shop panel's spot
// (above the shop panel while that's shown) lists the pets that did lately:
// portrait, name, level and souls toward the next one, and what was gained.
// Click-through like the widget, on the tray's thread; an overlay
// (overlay_windows.go). Main keeps the rows (internal/souls) and hides it;
// hiding fades it out.

// SoulView is what the soul popup shows, oldest gain first.
type SoulView struct {
	Pets []SoulPet
}

// SoulPet is one pet in the soul popup.
type SoulPet struct {
	Name string
	// Its portrait; nil draws an empty square.
	Icon image.Image
	// Souls gained lately.
	Gained int
	// Its Insight level after the gains (0 locked), negative when unknown,
	// and its souls toward the next level.
	Level int
	Souls int
	// The gains reached a new level.
	LevelUp bool
}

const (
	wmSoulPopup = 0x8000 + 6 // WM_APP + 6: the soul popup's pets changed
	// The gap between the popup and the shop panel below it.
	soulGap = 8
)

type soulPopup struct {
	hwnd     uintptr
	scale    float64
	nameFont uintptr
	tagFont  uintptr
	// What main asked for last (nil: hidden), the opacity preview's sample
	// shown over it meanwhile, and what is drawn (kept while fading out).
	view    *SoulView
	preview *SoulView
	drawn   *SoulView
	alpha   int
	// Where it sits, in screen pixels.
	x, y, w, h int32
	icons      map[iconKey][]byte
}

var currentSoulPopup *soulPopup

func (s *soulPopup) px(v int) int32 {
	return int32(float64(v)*s.scale + 0.5)
}

func newSoulPopup(instance uintptr) *soulPopup {
	s := &soulPopup{scale: 1}
	className := wide("DaevanionCompanionSoulPopup")
	class := wndClassEx{
		WndProc:   syscall.NewCallback(soulPopupProc),
		Instance:  instance,
		ClassName: className,
	}
	class.Size = uint32(unsafe.Sizeof(class))
	if r, _, _ := registerClassEx.Call(uintptr(unsafe.Pointer(&class))); r == 0 {
		return nil
	}
	style := uintptr(wsExTopmost | wsExTransparent | wsExToolWindow | wsExLayered | wsExNoActivate)
	s.hwnd, _, _ = createWindowEx.Call(style, uintptr(unsafe.Pointer(className)), uintptr(unsafe.Pointer(wide("Daevanion Companion souls"))), wsPopup, 0, 0, 0, 0, 0, 0, instance, 0)
	if s.hwnd == 0 {
		return nil
	}
	s.makeFonts()
	currentSoulPopup = s
	return s
}

func (s *soulPopup) makeFonts() {
	for _, font := range []uintptr{s.nameFont, s.tagFont} {
		if font != 0 {
			deleteObject.Call(font)
		}
	}
	segoe := uintptr(unsafe.Pointer(wide("Segoe UI")))
	s.nameFont, _, _ = createFont.Call(uintptr(-s.px(15)), 0, 0, 0, fwNormal, 0, 0, 0, 1, 0, 0, antialiasedQuality, 0, segoe)
	s.tagFont, _, _ = createFont.Call(uintptr(-s.px(12)), 0, 0, 0, fwSemibold, 0, 0, 0, 1, 0, 0, antialiasedQuality, 0, segoe)
}

func (s *soulPopup) measure(font uintptr, text string) int32 {
	dc, _, _ := getDC.Call(s.hwnd)
	defer releaseDC.Call(s.hwnd, dc)
	old, _, _ := selectObject.Call(dc, font)
	defer selectObject.Call(dc, old)
	r := rect{}
	drawText.Call(dc, uintptr(unsafe.Pointer(wide(text))), ^uintptr(0), uintptr(unsafe.Pointer(&r)), dtCalcRect|dtSingleLine|dtNoPrefix)
	return r.Right - r.Left
}

// soulLines is what a pet's row says: the level and souls at the right of
// its name (none when unknown), and below the name what was gained and, in
// the level's color, a level reached.
func soulLines(pet SoulPet) (level string, levelColor uintptr, progress, gained, reached string) {
	if pet.Level >= 0 {
		level, levelColor, progress = levelText(pet.Level, pet.Souls)
	}
	gained = "+" + strconv.Itoa(pet.Gained) + " soul"
	if pet.Gained != 1 {
		gained += "s"
	}
	if pet.LevelUp && pet.Level >= 1 {
		reached = "Lv" + strconv.Itoa(min(pet.Level, 3)) + " reached"
	}
	return
}

// show takes what main wants shown (nil fades the popup out).
func (s *soulPopup) show(view *SoulView) {
	s.view = view
	if s.preview == nil {
		s.apply(view)
	}
}

// apply puts a view up at full strength, or fades out for nil.
func (s *soulPopup) apply(view *SoulView) {
	killTimer.Call(s.hwnd, timerFade)
	if view == nil {
		if s.drawn != nil && s.alpha > 0 {
			setTimer.Call(s.hwnd, timerFade, fadeStepMs, 0)
		} else {
			s.hide()
		}
		return
	}
	s.drawn = view
	s.alpha = 255
	s.place()
}

func (s *soulPopup) hide() {
	s.drawn = nil
	s.alpha = 0
	showWindow.Call(s.hwnd, swHide)
}

func (s *soulPopup) startPreview(sample *SoulView) {
	s.preview = sample
	s.apply(sample)
}

func (s *soulPopup) endPreview() {
	if s.preview == nil {
		return
	}
	s.preview = nil
	if s.view == nil {
		s.hide()
		return
	}
	s.apply(s.view)
}

// Rows are as tall as the shop panel's pet rows.
func (s *soulPopup) rowHeight() int32 {
	return s.px(panelLine) + s.px(4) + s.px(panelTag)
}

// place lays out what is drawn on the shop panel's column (above the panel
// while it's shown) and draws it at the current fade.
func (s *soulPopup) place() {
	view := s.drawn
	if view == nil {
		return
	}
	right, bottom, scale := panelBase(s.scale)
	if scale != s.scale {
		s.scale = scale
		s.makeFonts()
	}
	if p := currentShopPanel; p != nil {
		if top, ok := p.visibleTop(); ok {
			bottom = top - s.px(soulGap)
		}
	}
	column := s.px(panelIcon) + s.px(panelIconGap)
	var width int32
	// Room for the widest level and souls, gain and level reached, on every
	// row: more souls never change the popup's width.
	var widestLevel int32
	for level := 0; level <= 3; level++ {
		souls := 0
		if level < 3 {
			souls = soulsToLevel[level] - 1
		}
		label, _, progress := levelText(level, souls)
		w := s.measure(s.tagFont, label)
		if progress != "" {
			w += s.px(panelBadgeGap) + s.measure(s.nameFont, progress)
		}
		widestLevel = max(widestLevel, w)
	}
	below := column + s.measure(s.tagFont, "+99 souls") + s.px(panelBadgeGap) + s.measure(s.tagFont, "· Lv3 reached")
	for _, pet := range view.Pets {
		width = max(width, column+s.measure(s.nameFont, pet.Name)+s.px(16)+widestLevel, below)
	}
	n := int32(len(view.Pets))
	s.w = max(width, s.px(180)) + 2*s.px(panelPad)
	s.h = 2*s.px(panelPad) + n*s.rowHeight() + max(0, n-1)*(s.px(panelPetGap)+s.px(4))
	s.x = right - s.w
	s.y = bottom - s.h
	setWindowPos.Call(s.hwnd, hwndTopmost, uintptr(s.x), uintptr(s.y), uintptr(s.w), uintptr(s.h), swpNoActivate)
	s.render()
	showWindow.Call(s.hwnd, swShowNoActivate)
}

func (s *soulPopup) render() {
	renderOverlay(s.hwnd, s.x, s.y, s.w, s.h, s.px(12), soulBackground, byte(max(0, min(255, s.alpha))), nil, s.draw)
}

func (s *soulPopup) draw(dc uintptr, client rect) {
	if s.drawn == nil {
		return
	}
	left := s.px(panelPad)
	right := client.Right - s.px(panelPad)
	oldFont, _, _ := selectObject.Call(dc, s.nameFont)
	pen, _, _ := getStockObject.Call(nullPen)
	oldPen, _, _ := selectObject.Call(dc, pen)
	top := s.px(panelPad)
	size := s.px(panelIcon)
	for _, pet := range s.drawn.Pets {
		level, levelColor, progress, gained, reached := soulLines(pet)
		iconTop := top + (s.rowHeight()-size)/2
		if pet.Icon != nil {
			drawPixels(dc, left, iconTop, size, cachedIcon(&s.icons, pet.Icon, size, s.px(panelIconR)))
		} else {
			brush, _, _ := createSolidBrush.Call(colorIconBg)
			oldBrush, _, _ := selectObject.Call(dc, brush)
			roundRect.Call(dc, uintptr(left), uintptr(iconTop), uintptr(left+size+1), uintptr(iconTop+size+1), uintptr(2*s.px(panelIconR)), uintptr(2*s.px(panelIconR)))
			selectObject.Call(dc, oldBrush)
			deleteObject.Call(brush)
		}
		textLeft := left + size + s.px(panelIconGap)

		line := rect{Left: textLeft, Top: top, Right: right, Bottom: top + s.px(panelLine)}
		selectObject.Call(dc, s.nameFont)
		setTextColor.Call(dc, colorText)
		drawText.Call(dc, uintptr(unsafe.Pointer(wide(pet.Name))), ^uintptr(0), uintptr(unsafe.Pointer(&line)), dtLeft|dtVCenter|dtSingleLine|dtNoPrefix)
		if progress != "" {
			drawText.Call(dc, uintptr(unsafe.Pointer(wide(progress))), ^uintptr(0), uintptr(unsafe.Pointer(&line)), dtRight|dtVCenter|dtSingleLine|dtNoPrefix)
		}
		if level != "" {
			badge := line
			if progress != "" {
				badge.Right -= s.measure(s.nameFont, progress) + s.px(panelBadgeGap)
			}
			selectObject.Call(dc, s.tagFont)
			setTextColor.Call(dc, levelColor)
			drawText.Call(dc, uintptr(unsafe.Pointer(wide(level))), ^uintptr(0), uintptr(unsafe.Pointer(&badge)), dtRight|dtVCenter|dtSingleLine|dtNoPrefix)
		}

		below := rect{Left: textLeft, Top: line.Bottom + s.px(4), Right: right, Bottom: line.Bottom + s.px(4) + s.px(panelTag)}
		selectObject.Call(dc, s.tagFont)
		setTextColor.Call(dc, colorConnected)
		drawText.Call(dc, uintptr(unsafe.Pointer(wide(gained))), ^uintptr(0), uintptr(unsafe.Pointer(&below)), dtLeft|dtVCenter|dtSingleLine|dtNoPrefix)
		if reached != "" {
			below.Left += s.measure(s.tagFont, gained) + s.px(panelBadgeGap)
			setTextColor.Call(dc, levelColors[min(pet.Level, 3)])
			drawText.Call(dc, uintptr(unsafe.Pointer(wide("· "+reached))), ^uintptr(0), uintptr(unsafe.Pointer(&below)), dtLeft|dtVCenter|dtSingleLine|dtNoPrefix)
		}
		top += s.rowHeight() + s.px(panelPetGap) + s.px(4)
	}
	selectObject.Call(dc, oldPen)
	selectObject.Call(dc, oldFont)
}

func (s *soulPopup) tick(id uintptr) {
	if id != timerFade {
		return
	}
	s.alpha -= fadeStep
	if s.alpha <= 0 {
		killTimer.Call(s.hwnd, timerFade)
		s.hide()
		return
	}
	s.render()
}

// placeSoulPopup moves the popup, while it's up, after the shop panel moved,
// showed or hid.
func placeSoulPopup() {
	if s := currentSoulPopup; s != nil && s.drawn != nil {
		s.place()
	}
}

func soulPopupProc(hwnd, message, wParam, lParam uintptr) uintptr {
	s := currentSoulPopup
	if s != nil && hwnd == s.hwnd && message == wmTimer {
		s.tick(wParam)
		return 0
	}
	r, _, _ := defWindowProc.Call(hwnd, message, wParam, lParam)
	return r
}
