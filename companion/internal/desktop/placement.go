package desktop

import "math"

// Placement is where an overlay (the shop panel, the soul popup) sits and how
// big it is, set by moving and resizing it (the settings window's Move and
// resize).
type Placement struct {
	// Its bottom right corner, as fractions (0-1) of the game window's client
	// area (the monitor's work area without the game), so it follows the game
	// window and its size. Negative: its usual spot.
	X float64 `json:"x"`
	Y float64 `json:"y"`
	// How big its content is drawn, 1 as usual (MinZoom-MaxZoom); its width
	// follows the content.
	Zoom float64 `json:"zoom"`
	// The most pets it lists (1 up to its maximum); 0 is its maximum.
	Rows int `json:"rows"`
}

// The zoom an overlay can be drawn at, and the most pets each lists: rows
// past them only make it taller than a screen needs (a shop tab sells about
// a dozen; the soul feed keeps 4, souls.MaxRows).
const (
	MinZoom     = 0.7
	MaxZoom     = 2.0
	ShopMaxRows = 12
	SoulMaxRows = 4
)

// DefaultPlacement is the usual spot, size and rows.
func DefaultPlacement() Placement {
	return Placement{X: -1, Y: -1, Zoom: 1}
}

// Moved says whether it has a spot of its own.
func (p Placement) Moved() bool {
	return p.X >= 0 && p.Y >= 0
}

// Clean puts values out of range (an edited file) back in range: a spot
// outside the area is the usual one, a zoom out of range is clamped (none is
// 1), rows are 0 up to maxRows.
func (p Placement) Clean(maxRows int) Placement {
	if !p.Moved() || p.X > 1 || p.Y > 1 || math.IsNaN(p.X) || math.IsNaN(p.Y) {
		p.X, p.Y = -1, -1
	}
	if p.Zoom == 0 || math.IsNaN(p.Zoom) {
		p.Zoom = 1
	}
	p.Zoom = max(MinZoom, min(MaxZoom, p.Zoom))
	p.Rows = max(0, min(maxRows, p.Rows))
	return p
}

// RowsShown is how many pets it lists at most.
func (p Placement) RowsShown(maxRows int) int {
	if p.Rows <= 0 || p.Rows > maxRows {
		return maxRows
	}
	return p.Rows
}

// Edges of an overlay being resized (any together); none moves it.
const (
	edgeLeft = 1 << iota
	edgeTop
	edgeRight
	edgeBottom
)

// grab says which edges a point (x, y) inside a w x h overlay grabs: those
// within margin of it. None in the middle (it moves).
func grab(x, y, w, h, margin int32) int {
	edges := 0
	if x < margin {
		edges |= edgeLeft
	} else if x >= w-margin {
		edges |= edgeRight
	}
	if y < margin {
		edges |= edgeTop
	} else if y >= h-margin {
		edges |= edgeBottom
	}
	return edges
}

// resized is the placement after dragging edges by (dx, dy) screen pixels,
// from start (the overlay was w x h then, rowH a pet row's height with its
// gap): the width scales the zoom, the height adds or takes whole rows.
// Edges moving left or up grow it.
func resized(start Placement, edges int, dx, dy, w, h, rowH int32, maxRows int) Placement {
	p := start
	if edges&(edgeLeft|edgeRight) != 0 && w > 0 {
		grow := dx
		if edges&edgeLeft != 0 {
			grow = -dx
		}
		p.Zoom = max(MinZoom, min(MaxZoom, start.Zoom*float64(w+grow)/float64(w)))
	}
	if edges&(edgeTop|edgeBottom) != 0 && rowH > 0 {
		grow := dy
		if edges&edgeTop != 0 {
			grow = -dy
		}
		rows := start.RowsShown(maxRows) + int(math.Round(float64(grow)/float64(rowH)))
		p.Rows = max(1, min(maxRows, rows))
	}
	return p
}

// anchorAt is the bottom right corner (x, y) as fractions of area, kept
// within it.
func anchorAt(x, y int32, area rect) (float64, float64) {
	fraction := func(v, lo, hi int32) float64 {
		if hi <= lo {
			return 1
		}
		return max(0, min(1, float64(v-lo)/float64(hi-lo)))
	}
	return fraction(x, area.Left, area.Right), fraction(y, area.Top, area.Bottom)
}

// placedRect is where a w x h overlay with this placement's spot sits in
// area: its bottom right corner at the spot, moved in to stay inside.
func placedRect(p Placement, w, h int32, area rect) rect {
	right := area.Left + int32(math.Round(p.X*float64(area.Right-area.Left)))
	bottom := area.Top + int32(math.Round(p.Y*float64(area.Bottom-area.Top)))
	left := max(area.Left, min(right-w, area.Right-w))
	top := max(area.Top, min(bottom-h, area.Bottom-h))
	return rect{Left: left, Top: top, Right: left + w, Bottom: top + h}
}
