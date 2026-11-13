package desktop

import (
	"slices"
	"strconv"
	"syscall"
	"unsafe"

	"daevanion-companion/internal/shop"
)

// The settings window: dark, in tabs (Game data, Shop panel, Account), drawn
// by the companion itself (Windows' own buttons and checkboxes have no dark
// style); only the seconds box is a real edit control. A click on the tray
// icon opens it on Account when logged out, else on the first tab; closing
// it only hides it (Exit is a button). It lives on the tray's thread and
// reads State when shown and on Tray.Refresh.

var (
	dwmapi = syscall.NewLazyDLL("dwmapi.dll")

	sendMessage           = user32.NewProc("SendMessageW")
	setWindowText         = user32.NewProc("SetWindowTextW")
	getWindowText         = user32.NewProc("GetWindowTextW")
	getFocus              = user32.NewProc("GetFocus")
	isDialogMessage       = user32.NewProc("IsDialogMessageW")
	adjustWindowRectEx    = user32.NewProc("AdjustWindowRectEx")
	loadCursor            = user32.NewProc("LoadCursorW")
	setCursor             = user32.NewProc("SetCursor")
	setCapture            = user32.NewProc("SetCapture")
	releaseCapture        = user32.NewProc("ReleaseCapture")
	trackMouseEvent       = user32.NewProc("TrackMouseEvent")
	moveWindow            = user32.NewProc("MoveWindow")
	setFocus              = user32.NewProc("SetFocus")
	createPen             = gdi32.NewProc("CreatePen")
	createCompatibleBmp   = gdi32.NewProc("CreateCompatibleBitmap")
	bitBlt                = gdi32.NewProc("BitBlt")
	setBkColor            = gdi32.NewProc("SetBkColor")
	moveToEx              = gdi32.NewProc("MoveToEx")
	lineTo                = gdi32.NewProc("LineTo")
	dwmSetWindowAttribute = dwmapi.NewProc("DwmSetWindowAttribute")
)

const (
	wsOverlapped      = 0x00000000
	wsCaption         = 0x00C00000
	wsSysMenu         = 0x00080000
	wsMinimizeBox     = 0x00020000
	wsChild           = 0x40000000
	wsClipChildren    = 0x02000000
	wsTabStop         = 0x00010000
	esCenter          = 0x0001
	esNumber          = 0x2000
	esAutoHScroll     = 0x0080
	wmSetFont         = 0x0030
	wmCommand         = 0x0111
	wmEraseBkgnd      = 0x0014
	wmSetCursor       = 0x0020
	wmMouseMove       = 0x0200
	wmLButtonDown     = 0x0201
	wmMouseLeave      = 0x02A3
	wmCtlColorEdit    = 0x0133
	enChange          = 0x0300
	enSetFocus        = 0x0100
	enKillFocus       = 0x0200
	swShowNormal      = 1
	idcArrow          = 32512
	idcHand           = 32649
	smCxIcon          = 11
	smCyIcon          = 12
	srcCopy           = 0x00CC0020
	psSolid           = 0
	tmeLeave          = 0x0002
	dtWordBreak       = 0x0010
	dtEndEllipsis     = 0x8000
	dwmDarkMode       = 20         // DWMWA_USE_IMMERSIVE_DARK_MODE (Windows 10 2004+)
	dwmCaptionColor   = 35         // DWMWA_CAPTION_COLOR (Windows 11)
	dwmTextColor      = 36         // DWMWA_TEXT_COLOR (Windows 11)
	wmRefresh         = 0x8000 + 4 // WM_APP + 4: State changed, redraw the settings window
	idShopSecondsEdit = 200
)

// TrackerURL is the site's Tracker page, opened by the button beside the
// status.
const TrackerURL = "https://krathus88.github.io/Daevanion-Planner/tracker"

// Shop panel delays the window accepts, in seconds.
const (
	MinShopHideSeconds = 5
	MaxShopHideSeconds = 600
)

// Colors (BGR), the site's dark theme.
const (
	setBg          = 0x30221d // #1d2230
	setSurface     = 0x3d2c26 // #262c3d
	setSurfaceUp   = 0x4a362f // #2f364a, hovered
	setBorder      = 0x503b34 // #343b50
	setText        = 0xf1ebe9 // #e9ebf1
	setMuted       = 0xb7a8a4 // #a4a8b7
	setFaint       = 0x7d6e6a // #6a6e7d, disabled
	setAccent      = 0xf0a85b // #5ba8f0
	setAccentUp    = 0xf3b674 // #74b6f3
	setAccentInk   = 0x261a12 // #121a26, text on accent
	setDanger      = 0x7f7ff0 // #f07f7f
	setDangerBg    = 0x3a2a35 // #352a3a, hovered danger
	setDotActive   = 0x9ad35f // #5fd39a
	setDotInactive = 0x50b4e6 // #e6b450
)

// The tabs, in order. The window opens on the first, or on Account when
// logged out.
const (
	tabGameData = iota
	tabShop
	tabAccount
	tabCount
)

var tabNames = [tabCount]string{"Game data", "Shop panel", "Account"}

// Things to click.
const (
	hitNone = iota
	hitTab0
	hitTab1
	hitTab2
	hitStartup
	hitRecord
	hitOpenRecordings
	hitOpenLog
	hitLogIn
	hitExit
	hitSlider
	hitTracker
	hitCheckUpdates
	// Type chips: All, then shop.Types.
	hitType0
	hitTypeLast = hitType0 + 5
	// Hide Insight Lv1-3.
	hitLevel1 = hitTypeLast + 1
	hitLevel3 = hitLevel1 + 2
	// Show only: shop.Sources.
	hitSource0    = hitLevel3 + 1
	hitSourceLast = hitSource0 + 4
)

// Layout in 96 DPI pixels.
const (
	setWidth   = 440
	setHeight  = 528
	setPad     = 24
	setTabsTop = 60
	setTabsH   = 36
	setContent = 112
	setCardH   = 88
	setGap     = 10
	setFooter  = 470
	setButtonH = 32
)

type buttonStyle int

const (
	stylePlain buttonStyle = iota
	stylePrimary
	styleDanger
)

// element is one thing drawn: a card, a button, a toggle or text.
type element struct {
	hit      int
	r        rect
	text     string
	style    buttonStyle
	enabled  bool
	on       bool
	kind     int
	font     uintptr
	color    uintptr
	wrap     bool
	selected bool
}

const (
	kindText = iota
	kindCard
	kindButton
	kindToggle
	kindTab
	kindLine
	kindDot
	kindEditBox
	kindSlider
	kindChip
)

// Pet type and Insight level colors (BGR), the site's pet.* tokens.
var (
	typeColors = map[string]uintptr{
		"cogni":   0xfcae86, // #86aefc
		"fera":    0x7a77f2, // #f2777a
		"natura":  0x9ad35f, // #5fd39a
		"varian":  0xfeb4d8, // #d8b4fe
		"special": 0x5bc0ef, // #efc05b
	}
	typeNames   = map[string]string{"cogni": "Cogni", "fera": "Fera", "natura": "Natura", "varian": "Varian", "special": "Special"}
	levelColors = [4]uintptr{0, 0x80de4a, 0xfaa560, 0x3c92fb} // #4ade80, #60a5fa, #fb923c
	// The Shop check's names (the site's getShopSourceName).
	sourceNames = map[string]string{
		"notWild":  "Not in the wild",
		"verteron": "Only Verteron",
		"reshanta": "Only Lower Reshanta",
		"altgard":  "Only Altgard",
		"several":  "Several maps",
	}
)

type settingsWindow struct {
	hwnd     uintptr
	edit     uintptr
	scale    float64
	body     uintptr
	strong   uintptr
	title    uintptr
	small    uintptr
	editBg   uintptr
	state    State
	tab      int
	hover    int
	pressed  int
	tracking bool
	focused  bool
	// The delay shown, to put back a value being typed when focus leaves.
	shopSeconds int
	// The opacity shown: State's, or the slider's while dragged.
	opacity  int
	dragging bool
	// The opacity preview is up (see previewOpacity).
	previewing bool
}

var currentSettings *settingsWindow

func (s *settingsWindow) px(v int) int32 {
	return int32(float64(v)*s.scale + 0.5)
}

func (s *settingsWindow) box(x, y, w, h int) rect {
	return rect{Left: s.px(x), Top: s.px(y), Right: s.px(x + w), Bottom: s.px(y + h)}
}

func newSettingsWindow(instance, smallIcon uintptr) *settingsWindow {
	dpi, _, _ := getDpiForSystem.Call()
	if dpi == 0 {
		dpi = 96
	}
	s := &settingsWindow{scale: float64(dpi) / 96}
	className := wide("DaevanionCompanionSettings")
	cursor, _, _ := loadCursor.Call(0, idcArrow)
	cx, _, _ := getSystemMetrics.Call(smCxIcon)
	cy, _, _ := getSystemMetrics.Call(smCyIcon)
	icon, _, _ := loadImage.Call(instance, appIconID, imageIcon, cx, cy, 0)
	background, _, _ := createSolidBrush.Call(setBg)
	class := wndClassEx{
		WndProc:    syscall.NewCallback(settingsProc),
		Instance:   instance,
		Icon:       icon,
		IconSm:     smallIcon,
		Cursor:     cursor,
		Background: background,
		ClassName:  className,
	}
	class.Size = uint32(unsafe.Sizeof(class))
	if r, _, _ := registerClassEx.Call(uintptr(unsafe.Pointer(&class))); r == 0 {
		return nil
	}

	style := uintptr(wsOverlapped | wsCaption | wsSysMenu | wsMinimizeBox | wsClipChildren)
	frame := rect{Right: s.px(setWidth), Bottom: s.px(setHeight)}
	adjustWindowRectEx.Call(uintptr(unsafe.Pointer(&frame)), style, 0, 0)
	width, height := frame.Right-frame.Left, frame.Bottom-frame.Top
	// Centered on the main monitor.
	monitor, _, _ := monitorFromPoint.Call(0, monitorDefaultToPrimary)
	area, _ := workArea(monitor)
	x := area.Left + (area.Right-area.Left-width)/2
	y := area.Top + (area.Bottom-area.Top-height)/2
	s.hwnd, _, _ = createWindowEx.Call(0, uintptr(unsafe.Pointer(className)), uintptr(unsafe.Pointer(wide("Daevanion Companion"))), style, uintptr(x), uintptr(y), uintptr(width), uintptr(height), 0, 0, instance, 0)
	if s.hwnd == 0 {
		return nil
	}
	// A dark title bar; Windows 11 also takes its colors.
	dark := int32(1)
	dwmSetWindowAttribute.Call(s.hwnd, dwmDarkMode, uintptr(unsafe.Pointer(&dark)), 4)
	caption, text := uint32(setBg), uint32(setText)
	dwmSetWindowAttribute.Call(s.hwnd, dwmCaptionColor, uintptr(unsafe.Pointer(&caption)), 4)
	dwmSetWindowAttribute.Call(s.hwnd, dwmTextColor, uintptr(unsafe.Pointer(&text)), 4)

	segoe := uintptr(unsafe.Pointer(wide("Segoe UI")))
	// The system's text smoothing, like other windows (ClearType unless
	// turned off): the window is opaque, unlike the overlays.
	font := func(size, weight int) uintptr {
		f, _, _ := createFont.Call(uintptr(-s.px(size)), 0, 0, 0, uintptr(weight), 0, 0, 0, 1, 0, 0, 0, 0, segoe)
		return f
	}
	s.body = font(13, fwNormal)
	s.strong = font(13, fwSemibold)
	s.title = font(16, fwSemibold)
	s.small = font(12, fwNormal)
	s.editBg, _, _ = createSolidBrush.Call(setSurface)

	s.edit, _, _ = createWindowEx.Call(0, uintptr(unsafe.Pointer(wide("EDIT"))), 0, wsChild|wsTabStop|esNumber|esCenter|esAutoHScroll,
		0, 0, 0, 0, s.hwnd, idShopSecondsEdit, instance, 0)
	sendMessage.Call(s.edit, wmSetFont, s.strong, 0)
	sendMessage.Call(s.edit, 0x00C5, 3, 0) // EM_LIMITTEXT: 3 digits
	currentSettings = s
	return s
}

func (s *settingsWindow) text(c uintptr) string {
	var buf [16]uint16
	getWindowText.Call(c, uintptr(unsafe.Pointer(&buf[0])), uintptr(len(buf)))
	return syscall.UTF16ToString(buf[:])
}

// shopSecondsTyped is the delay in the edit box, if it's one the window
// accepts.
func (s *settingsWindow) shopSecondsTyped() (int, bool) {
	n, err := strconv.Atoi(s.text(s.edit))
	if err != nil || n < MinShopHideSeconds || n > MaxShopHideSeconds {
		return 0, false
	}
	return n, true
}

// The shop tab's card holds the seconds box at this spot (96 DPI).
const (
	editX   = setPad + 16 + 110
	editY   = setContent + 14
	editW   = 60
	editH   = 30
	sliderX = editX
	sliderY = setContent + 56
	sliderW = 196
	sliderH = 30
)

// layout lists what the open tab shows.
func (s *settingsWindow) layout() []element {
	st := s.state
	var out []element
	add := func(e element) { out = append(out, e) }
	textAt := func(r rect, text string, font, color uintptr, wrap bool) {
		add(element{kind: kindText, r: r, text: text, font: font, color: color, wrap: wrap})
	}
	inner := setWidth - 2*setPad

	// Status.
	dot := uintptr(setDotInactive)
	if st.Playing {
		dot = setDotActive
	}
	add(element{kind: kindDot, r: s.box(setPad, 26, 10, 10), color: dot})
	trackerW := int(float64(s.measure(s.strong, "Open Tracker"))/s.scale) + 28
	add(element{kind: kindButton, hit: hitTracker, r: s.box(setWidth-setPad-trackerW, 16, trackerW, 30), text: "Open Tracker", enabled: true})
	textAt(s.box(setPad+20, 18, inner-20-trackerW-12, 26), st.Status, s.title, setText, false)

	// Tabs.
	x := setPad
	for k := 0; k < tabCount; k++ {
		w := int(float64(s.measure(s.strong, tabNames[k]))/s.scale) + 24
		add(element{kind: kindTab, hit: hitTab0 + k, r: s.box(x, setTabsTop, w, setTabsH), text: tabNames[k], selected: k == s.tab, enabled: true})
		x += w + 4
	}
	add(element{kind: kindLine, r: s.box(0, setTabsTop+setTabsH, setWidth, 1), color: setBorder})

	// A card: title and description on the left, room for a control of
	// controlW on the right.
	card := func(y int, title, description string, controlW int) {
		add(element{kind: kindCard, r: s.box(setPad, y, inner, setCardH)})
		textW := inner - 32 - controlW
		textAt(s.box(setPad+16, y+12, textW, 22), title, s.strong, setText, false)
		textAt(s.box(setPad+16, y+34, textW, setCardH-40), description, s.small, setMuted, true)
	}
	right := setWidth - setPad - 16
	middle := func(y, h int) int { return y + (setCardH-h)/2 }

	switch s.tab {
	case tabGameData:
		y := setContent
		card(y, "Start with Windows", "Runs in the notification area from the moment you log in to Windows.", 52)
		add(element{kind: kindToggle, hit: hitStartup, r: s.box(right-44, middle(y, 24), 44, 24), on: st.Startup, enabled: st.StartupAvailable})
		y += setCardH + setGap
		label, style := "Record", stylePlain
		if st.Recording {
			label, style = "Stop recording", styleDanger
		}
		card(y, "Record game data", "Saves the game's messages to a file you can send in, so more of the game can be read.", 136)
		add(element{kind: kindButton, hit: hitRecord, r: s.box(right-130, middle(y, setButtonH), 130, setButtonH), text: label, style: style, enabled: true})
		y += setCardH + setGap
		updates := "Version " + st.Version + ". Checks by itself at start and every 6 hours."
		if !st.CanUpdate {
			updates = "Version " + st.Version + ": a test build, which never updates."
		}
		label = "Check now"
		if st.CheckingUpdates {
			label = "Checking…"
		}
		card(y, "Updates", updates, 136)
		add(element{kind: kindButton, hit: hitCheckUpdates, r: s.box(right-130, middle(y, setButtonH), 130, setButtonH), text: label, enabled: st.CanUpdate && !st.CheckingUpdates})
		y += setCardH + setGap + 4
		add(element{kind: kindButton, hit: hitOpenRecordings, r: s.box(setPad, y, 140, setButtonH), text: "Open recordings", enabled: true})
		add(element{kind: kindButton, hit: hitOpenLog, r: s.box(setPad+148, y, 100, setButtonH), text: "Open log", enabled: true})

	case tabShop:
		y := setContent
		add(element{kind: kindCard, r: s.box(setPad, y, inner, 100)})
		textAt(s.box(setPad+16, editY, 110, editH), "Hide after", s.strong, setText, false)
		add(element{kind: kindEditBox, r: s.box(editX, editY, editW, editH), on: s.focused})
		textAt(s.box(editX+editW+8, editY, 190, editH), "seconds without shop activity", s.small, setMuted, false)
		textAt(s.box(setPad+16, sliderY, 110, sliderH), "Background", s.strong, setText, false)
		add(element{kind: kindSlider, hit: hitSlider, r: s.box(sliderX, sliderY, sliderW, sliderH), on: s.dragging, enabled: true, text: strconv.Itoa(s.opacity)})
		textAt(s.box(sliderX+sliderW+8, sliderY, 44, sliderH), strconv.Itoa(s.opacity)+"%", s.body, setText, false)

		y += 100 + setGap
		top := y
		add(element{kind: kindCard, r: s.box(setPad, y, inner, 0)})
		textAt(s.box(setPad+16, y+12, 200, 22), "Show pets", s.strong, setText, false)
		label := func(y int, text string) {
			textAt(s.box(setPad+16, y, 200, 16), text, s.small, setMuted, false)
		}
		// chips lays out a row of chips, wrapping, and returns the y below.
		chips := func(y int, list []element) int {
			x := setPad + 16
			for _, c := range list {
				w := int(float64(s.measure(s.body, c.text))/s.scale) + 22
				if x+w > setPad+inner-16 {
					x, y = setPad+16, y+32
				}
				c.kind, c.enabled, c.r = kindChip, true, s.box(x, y, w, 26)
				add(c)
				x += w + 6
			}
			return y + 26
		}
		label(y+40, "Type")
		types := []element{{hit: hitType0, text: "All", selected: len(st.ShopTypes) == 0, color: setText}}
		for k, id := range shop.Types {
			types = append(types, element{hit: hitType0 + 1 + k, text: typeNames[id], selected: slices.Contains(st.ShopTypes, id), color: typeColors[id]})
		}
		y = chips(y+58, types)
		label(y+8, "Hide Insight levels")
		var levels []element
		for level := 1; level <= 3; level++ {
			levels = append(levels, element{hit: hitLevel1 + level - 1, text: "Lv" + strconv.Itoa(level), selected: slices.Contains(st.ShopHiddenLevels, level), color: levelColors[level]})
		}
		y = chips(y+26, levels)
		label(y+8, "Show only (none: all)")
		var sources []element
		for k, id := range shop.Sources {
			sources = append(sources, element{hit: hitSource0 + k, text: sourceNames[id], selected: slices.Contains(st.ShopSources, id), color: setText})
		}
		y = chips(y+26, sources)
		out[slices.IndexFunc(out, func(e element) bool { return e.kind == kindCard && e.r.Top == s.px(top) })].r.Bottom = s.px(y + 14)

	case tabAccount:
		y := setContent
		description, label, style, enabled := "", "Log in with Discord", stylePrimary, st.CanLogIn
		switch {
		case !st.CanLogIn:
			description = "Offline test: nothing is sent."
		case st.LoggingIn:
			description, enabled = "Finish logging in in your browser.", false
		case st.LoggedIn && st.Account != "":
			description, label, style = "Logged in as "+st.Account+". Game data goes to your Daevanion Planner account.", "Log out", stylePlain
		case st.LoggedIn:
			description, label, style = "Logged in. Game data goes to your Daevanion Planner account.", "Log out", stylePlain
		default:
			description = "Not logged in: nothing is sent to the site."
		}
		w := 170
		if style == stylePlain {
			w = 100
		}
		card(y, "Discord", description, w)
		add(element{kind: kindButton, hit: hitLogIn, r: s.box(right-w, middle(y, setButtonH), w, setButtonH), text: label, style: style, enabled: enabled})
	}

	// Footer.
	add(element{kind: kindLine, r: s.box(0, setFooter, setWidth, 1), color: setBorder})
	textAt(s.box(setPad, setFooter+14, 240, setButtonH), "Closing this window keeps it running.", s.small, setMuted, false)
	add(element{kind: kindButton, hit: hitExit, r: s.box(setWidth-setPad-130, setFooter+14, 130, setButtonH), text: "Exit companion", style: styleDanger, enabled: true})
	return out
}

func (s *settingsWindow) measure(font uintptr, text string) int32 {
	dc, _, _ := getDC.Call(s.hwnd)
	defer releaseDC.Call(s.hwnd, dc)
	old, _, _ := selectObject.Call(dc, font)
	defer selectObject.Call(dc, old)
	r := rect{}
	drawText.Call(dc, uintptr(unsafe.Pointer(wide(text))), ^uintptr(0), uintptr(unsafe.Pointer(&r)), dtCalcRect|dtSingleLine|dtNoPrefix)
	return r.Right - r.Left
}

func fillRound(dc uintptr, r rect, radius int32, fill, border uintptr) {
	brush, _, _ := createSolidBrush.Call(fill)
	pen, _, _ := createPen.Call(psSolid, 1, border)
	oldBrush, _, _ := selectObject.Call(dc, brush)
	oldPen, _, _ := selectObject.Call(dc, pen)
	roundRect.Call(dc, uintptr(r.Left), uintptr(r.Top), uintptr(r.Right), uintptr(r.Bottom), uintptr(radius), uintptr(radius))
	selectObject.Call(dc, oldBrush)
	selectObject.Call(dc, oldPen)
	deleteObject.Call(brush)
	deleteObject.Call(pen)
}

func drawLabel(dc uintptr, r rect, text string, font, color, flags uintptr) {
	old, _, _ := selectObject.Call(dc, font)
	setTextColor.Call(dc, color)
	drawText.Call(dc, uintptr(unsafe.Pointer(wide(text))), ^uintptr(0), uintptr(unsafe.Pointer(&r)), flags|dtNoPrefix)
	selectObject.Call(dc, old)
}

func (s *settingsWindow) paint() {
	var ps paintStruct
	target, _, _ := beginPaint.Call(s.hwnd, uintptr(unsafe.Pointer(&ps)))
	defer endPaint.Call(s.hwnd, uintptr(unsafe.Pointer(&ps)))
	var client rect
	getClientRect.Call(s.hwnd, uintptr(unsafe.Pointer(&client)))

	// Drawn off screen, then copied: no flicker on hover.
	dc, _, _ := createCompatibleDC.Call(target)
	defer deleteDC.Call(dc)
	bitmap, _, _ := createCompatibleBmp.Call(target, uintptr(client.Right), uintptr(client.Bottom))
	defer deleteObject.Call(bitmap)
	oldBitmap, _, _ := selectObject.Call(dc, bitmap)
	defer selectObject.Call(dc, oldBitmap)

	background, _, _ := createSolidBrush.Call(setBg)
	fillRect.Call(dc, uintptr(unsafe.Pointer(&client)), background)
	deleteObject.Call(background)
	setBkMode.Call(dc, bkTransparent)

	center := uintptr(dtCenter | dtVCenter | dtSingleLine)
	for _, e := range s.layout() {
		hovered := e.hit != hitNone && e.hit == s.hover && e.enabled
		switch e.kind {
		case kindText:
			flags := uintptr(dtLeft | dtVCenter | dtSingleLine | dtEndEllipsis)
			if e.wrap {
				flags = dtLeft | dtWordBreak
			}
			drawLabel(dc, e.r, e.text, e.font, e.color, flags)
		case kindDot:
			fillRound(dc, e.r, e.r.Right-e.r.Left, e.color, e.color)
		case kindLine:
			fillRound(dc, e.r, 0, e.color, e.color)
		case kindCard:
			fillRound(dc, e.r, s.px(12), setSurface, setBorder)
		case kindTab:
			color := uintptr(setMuted)
			if e.selected || hovered {
				color = setText
			}
			drawLabel(dc, e.r, e.text, s.strong, color, center)
			if e.selected {
				line := rect{Left: e.r.Left + s.px(8), Top: e.r.Bottom - s.px(3), Right: e.r.Right - s.px(8), Bottom: e.r.Bottom}
				fillRound(dc, line, s.px(3), setAccent, setAccent)
			}
		case kindButton:
			fill, border, ink := uintptr(setSurface), uintptr(setBorder), uintptr(setText)
			switch e.style {
			case stylePrimary:
				fill, border, ink = setAccent, setAccent, setAccentInk
				if hovered {
					fill, border = setAccentUp, setAccentUp
				}
			case styleDanger:
				ink = setDanger
				if hovered {
					fill = setDangerBg
				}
			default:
				if hovered {
					fill = setSurfaceUp
				}
			}
			if !e.enabled {
				fill, border, ink = setSurface, setBorder, setFaint
			}
			fillRound(dc, e.r, s.px(8), fill, border)
			drawLabel(dc, e.r, e.text, s.strong, ink, center)
		case kindToggle:
			track, knob := uintptr(setSurfaceUp), uintptr(setMuted)
			if e.on {
				track, knob = setAccent, setAccentInk
			}
			if !e.enabled {
				track, knob = setSurface, setFaint
			}
			h := e.r.Bottom - e.r.Top
			fillRound(dc, e.r, h, track, track)
			size := h - s.px(6)
			left := e.r.Left + s.px(3)
			if e.on {
				left = e.r.Right - s.px(3) - size
			}
			fillRound(dc, rect{Left: left, Top: e.r.Top + s.px(3), Right: left + size, Bottom: e.r.Top + s.px(3) + size}, size, knob, knob)
		case kindEditBox:
			border := uintptr(setBorder)
			if e.on {
				border = setAccent
			}
			fillRound(dc, e.r, s.px(8), setSurface, border)
		case kindSlider:
			left, right := s.sliderTrack()
			middle := (e.r.Top + e.r.Bottom) / 2
			at := left + (right-left)*int32(s.opacity)/100
			track := s.px(6)
			fillRound(dc, rect{Left: left, Top: middle - track/2, Right: right, Bottom: middle + track/2}, track, setSurfaceUp, setSurfaceUp)
			fillRound(dc, rect{Left: left, Top: middle - track/2, Right: at, Bottom: middle + track/2}, track, setAccent, setAccent)
			knob := s.px(16)
			color := uintptr(setAccent)
			if e.on || hovered {
				color = setAccentUp
			}
			fillRound(dc, rect{Left: at - knob/2, Top: middle - knob/2, Right: at + knob/2, Bottom: middle + knob/2}, knob, color, setBg)
		case kindChip:
			fill, border, ink := uintptr(setSurface), uintptr(setBorder), uintptr(setMuted)
			if e.color != setText {
				ink = e.color
			}
			if hovered {
				fill = setSurfaceUp
			}
			if e.selected {
				fill, border = setSurfaceUp, setAccent
				if e.color == setText {
					ink = setText
				}
			}
			fillRound(dc, e.r, e.r.Bottom-e.r.Top, fill, border)
			drawLabel(dc, e.r, e.text, s.body, ink, center)
		}
	}
	bitBlt.Call(target, 0, 0, uintptr(client.Right), uintptr(client.Bottom), dc, 0, 0, srcCopy)
}

// sliderTrack is the opacity slider's track ends, in window pixels.
func (s *settingsWindow) sliderTrack() (int32, int32) {
	return s.px(sliderX + 8), s.px(sliderX + sliderW - 8)
}

// setOpacityAt moves the slider to x and previews the new opacity.
func (s *settingsWindow) setOpacityAt(x int32) {
	left, right := s.sliderTrack()
	value := int((float64(x-left)/float64(right-left))*100 + 0.5)
	value = max(0, min(100, value))
	if value == s.opacity && s.previewing {
		return
	}
	s.opacity = value
	s.previewOpacity()
	invalidateRect.Call(s.hwnd, 0, 0)
}

// The opacity preview stays this long after the slider was last moved.
const (
	previewTimer = 1
	previewMs    = 2500
)

// previewOpacity shows both overlays at the slider's opacity, the shop panel
// with sample pets, until endPreview.
func (s *settingsWindow) previewOpacity() {
	overlayBackground = OpacityByte(s.opacity)
	s.previewing = true
	if p := currentShopPanel; p != nil && current != nil {
		if sample := current.previewSample(); sample != nil {
			p.startPreview(sample)
		}
	}
	if w := currentWidget; w != nil {
		w.startPreview("Preview · " + strconv.Itoa(s.opacity) + "% background")
	}
	setTimer.Call(s.hwnd, previewTimer, previewMs, 0)
}

// endPreview puts the overlays back as they were, at the saved opacity.
func (s *settingsWindow) endPreview() {
	if !s.previewing {
		return
	}
	s.previewing = false
	killTimer.Call(s.hwnd, previewTimer)
	overlayBackground = OpacityByte(s.opacity)
	if p := currentShopPanel; p != nil {
		p.endPreview()
	}
	if w := currentWidget; w != nil {
		w.endPreview()
	}
}

// hitAt is what's clickable under (x, y), or hitNone.
func (s *settingsWindow) hitAt(x, y int32) int {
	for _, e := range s.layout() {
		if e.hit != hitNone && e.enabled && x >= e.r.Left && x < e.r.Right && y >= e.r.Top && y < e.r.Bottom {
			return e.hit
		}
	}
	return hitNone
}

// placeEdit shows the seconds box on the shop tab, inside its drawn frame.
func (s *settingsWindow) placeEdit() {
	if s.tab != tabShop {
		showWindow.Call(s.edit, swHide)
		return
	}
	lineH := s.px(20)
	box := s.box(editX, editY, editW, editH)
	top := box.Top + (box.Bottom-box.Top-lineH)/2
	moveWindow.Call(s.edit, uintptr(box.Left+s.px(6)), uintptr(top), uintptr(box.Right-box.Left-s.px(12)), uintptr(lineH), 1)
	showWindow.Call(s.edit, swShowNoActivate)
}

func (s *settingsWindow) setTab(tab int) {
	if tab == s.tab {
		return
	}
	s.tab = tab
	s.endPreview()
	setFocus.Call(s.hwnd)
	s.placeEdit()
	invalidateRect.Call(s.hwnd, 0, 0)
}

// refresh shows the state.
func (s *settingsWindow) refresh(state State) {
	s.state = state
	s.shopSeconds = state.ShopHideSeconds
	if !s.dragging {
		s.opacity = state.OverlayOpacity
	}
	// Not while it's being typed in.
	if focus, _, _ := getFocus.Call(); focus != s.edit {
		setWindowText.Call(s.edit, uintptr(unsafe.Pointer(wide(strconv.Itoa(state.ShopHideSeconds)))))
	}
	invalidateRect.Call(s.hwnd, 0, 0)
}

func (s *settingsWindow) show(state State) {
	s.tab = tabGameData
	if !state.LoggedIn && state.CanLogIn {
		s.tab = tabAccount
	}
	s.refresh(state)
	s.placeEdit()
	showWindow.Call(s.hwnd, swShowNormal)
	setForegroundWindow.Call(s.hwnd)
}

func (s *settingsWindow) click(hit int) {
	t := current
	if t == nil {
		return
	}
	switch hit {
	case hitTab0, hitTab1, hitTab2:
		s.setTab(hit - hitTab0)
	case hitStartup:
		t.on(Choice{Command: CommandStartup})
	case hitRecord:
		t.on(Choice{Command: CommandRecord})
	case hitOpenRecordings:
		t.on(Choice{Command: CommandOpenRecordings})
	case hitOpenLog:
		t.on(Choice{Command: CommandOpenLog})
	case hitLogIn:
		if s.state.LoggedIn {
			t.on(Choice{Command: CommandLogOut})
		} else {
			t.on(Choice{Command: CommandLogIn})
		}
	case hitExit:
		t.on(Choice{Command: CommandExit})
	case hitTracker:
		Open(TrackerURL)
	case hitCheckUpdates:
		t.on(Choice{Command: CommandCheckUpdates})
	default:
		switch {
		case hit >= hitType0 && hit <= hitTypeLast:
			t.on(Choice{Command: CommandShopType, Value: hit - hitType0})
		case hit >= hitLevel1 && hit <= hitLevel3:
			t.on(Choice{Command: CommandShopLevel, Value: hit - hitLevel1 + 1})
		case hit >= hitSource0 && hit <= hitSourceLast:
			t.on(Choice{Command: CommandShopSource, Value: hit - hitSource0})
		}
	}
}

func (s *settingsWindow) editCommand(code int) {
	switch code {
	case enChange:
		if n, ok := s.shopSecondsTyped(); ok && n != s.shopSeconds && current != nil {
			s.shopSeconds = n
			current.on(Choice{Command: CommandShopHide, Value: n})
		}
	case enSetFocus:
		s.focused = true
		invalidateRect.Call(s.hwnd, 0, 0)
	case enKillFocus:
		s.focused = false
		setWindowText.Call(s.edit, uintptr(unsafe.Pointer(wide(strconv.Itoa(s.shopSeconds)))))
		invalidateRect.Call(s.hwnd, 0, 0)
	}
}

type trackMouse struct {
	Size  uint32
	Flags uint32
	Hwnd  uintptr
	Hover uint32
}

func settingsProc(hwnd, message, wParam, lParam uintptr) uintptr {
	s := currentSettings
	if s == nil || hwnd != s.hwnd {
		r, _, _ := defWindowProc.Call(hwnd, message, wParam, lParam)
		return r
	}
	x, y := int32(int16(lParam&0xffff)), int32(int16(lParam>>16&0xffff))
	switch message {
	case wmPaint:
		s.paint()
		return 0
	case wmEraseBkgnd:
		return 1
	case wmCtlColorEdit:
		setTextColor.Call(wParam, setText)
		setBkColor.Call(wParam, setSurface)
		return s.editBg
	case wmCommand:
		if int(wParam&0xffff) == idShopSecondsEdit {
			s.editCommand(int(wParam >> 16 & 0xffff))
		}
		return 0
	case wmMouseMove:
		if !s.tracking {
			tm := trackMouse{Flags: tmeLeave, Hwnd: hwnd}
			tm.Size = uint32(unsafe.Sizeof(tm))
			trackMouseEvent.Call(uintptr(unsafe.Pointer(&tm)))
			s.tracking = true
		}
		if s.dragging {
			s.setOpacityAt(x)
			return 0
		}
		if hit := s.hitAt(x, y); hit != s.hover {
			s.hover = hit
			invalidateRect.Call(hwnd, 0, 0)
		}
		return 0
	case wmMouseLeave:
		s.tracking = false
		if s.hover != hitNone {
			s.hover = hitNone
			invalidateRect.Call(hwnd, 0, 0)
		}
		return 0
	case wmSetCursor:
		if wParam == hwnd && s.hover != hitNone {
			hand, _, _ := loadCursor.Call(0, idcHand)
			setCursor.Call(hand)
			return 1
		}
	case wmLButtonDown:
		s.pressed = s.hitAt(x, y)
		setCapture.Call(hwnd)
		if s.pressed == hitSlider {
			s.dragging = true
			s.setOpacityAt(x)
			return 0
		}
		if s.pressed == hitNone {
			// A click elsewhere leaves the seconds box.
			setFocus.Call(hwnd)
		}
		return 0
	case wmLButtonUp:
		releaseCapture.Call()
		if s.dragging {
			s.dragging = false
			s.pressed = hitNone
			// Saved; the preview stays a moment longer (previewTimer).
			if current != nil {
				current.on(Choice{Command: CommandOverlayOpacity, Value: s.opacity})
			}
			setTimer.Call(hwnd, previewTimer, previewMs, 0)
			invalidateRect.Call(hwnd, 0, 0)
			return 0
		}
		hit := s.hitAt(x, y)
		pressed := s.pressed
		s.pressed = hitNone
		if hit != hitNone && hit == pressed {
			s.click(hit)
		}
		return 0
	case wmTimer:
		if wParam == previewTimer && !s.dragging {
			s.endPreview()
		}
		return 0
	case wmClose:
		s.endPreview()
		showWindow.Call(hwnd, swHide)
		return 0
	}
	r, _, _ := defWindowProc.Call(hwnd, message, wParam, lParam)
	return r
}
