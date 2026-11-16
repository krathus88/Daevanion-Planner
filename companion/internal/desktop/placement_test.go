package desktop

import (
	"math"
	"testing"
)

func TestPlacementClean(t *testing.T) {
	got := Placement{X: 2, Y: 0.5, Zoom: 9, Rows: 40}.Clean(ShopMaxRows)
	if got != (Placement{X: -1, Y: -1, Zoom: MaxZoom, Rows: ShopMaxRows}) {
		t.Fatalf("out of range: %+v", got)
	}
	if got := (Placement{X: 0.5, Y: 0.25}).Clean(SoulMaxRows); got != (Placement{X: 0.5, Y: 0.25, Zoom: 1}) {
		t.Fatalf("no zoom: %+v", got)
	}
	if got := (Placement{X: math.NaN(), Y: 0.5, Zoom: 0.1, Rows: -3}).Clean(SoulMaxRows); got != (Placement{X: -1, Y: -1, Zoom: MinZoom}) {
		t.Fatalf("broken: %+v", got)
	}
	if DefaultPlacement().Moved() || !(Placement{X: 0, Y: 0}).Moved() {
		t.Fatal("Moved")
	}
}

func TestRowsShown(t *testing.T) {
	if (Placement{}).RowsShown(ShopMaxRows) != ShopMaxRows || (Placement{Rows: 3}).RowsShown(ShopMaxRows) != 3 {
		t.Fatal("RowsShown")
	}
}

func TestGrab(t *testing.T) {
	for _, c := range []struct {
		x, y  int32
		edges int
	}{
		{50, 50, 0},
		{2, 50, edgeLeft},
		{98, 50, edgeRight},
		{50, 1, edgeTop},
		{50, 199, edgeBottom},
		{1, 1, edgeLeft | edgeTop},
		{99, 199, edgeRight | edgeBottom},
	} {
		if got := grab(c.x, c.y, 100, 200, 8); got != c.edges {
			t.Errorf("(%d, %d): got %b, want %b", c.x, c.y, got, c.edges)
		}
	}
}

func TestResized(t *testing.T) {
	start := Placement{X: 0.9, Y: 0.8, Zoom: 1}
	// The left edge 50 px left of a 200 px wide panel: 25% bigger.
	if got := resized(start, edgeLeft, -50, 0, 200, 400, 50, ShopMaxRows); got.Zoom != 1.25 || got.Rows != 0 {
		t.Fatalf("left: %+v", got)
	}
	// The right edge the same way shrinks it, down to MinZoom at most.
	if got := resized(start, edgeRight, -190, 0, 200, 400, 50, ShopMaxRows); got.Zoom != MinZoom {
		t.Fatalf("right: %+v", got)
	}
	// The top edge 120 px down: two rows fewer than the 12 it showed.
	if got := resized(start, edgeTop, 0, 120, 200, 400, 50, ShopMaxRows); got.Rows != 10 || got.Zoom != 1 {
		t.Fatalf("top: %+v", got)
	}
	// Never under one row or over the most.
	if got := resized(Placement{Zoom: 1, Rows: 2}, edgeBottom, 0, -500, 200, 400, 50, SoulMaxRows); got.Rows != 1 {
		t.Fatalf("bottom: %+v", got)
	}
	if got := resized(Placement{Zoom: 1, Rows: 2}, edgeBottom, 0, 500, 200, 400, 50, SoulMaxRows); got.Rows != SoulMaxRows {
		t.Fatalf("bottom: %+v", got)
	}
	// A corner does both.
	if got := resized(start, edgeLeft|edgeTop, -100, -50, 200, 400, 50, ShopMaxRows); got.Zoom != 1.5 || got.Rows != ShopMaxRows {
		t.Fatalf("corner: %+v", got)
	}
}

func TestAnchorAndPlacedRect(t *testing.T) {
	area := rect{Left: 100, Top: 50, Right: 1100, Bottom: 1050}
	x, y := anchorAt(600, 300, area)
	if x != 0.5 || y != 0.25 {
		t.Fatalf("anchor %v, %v", x, y)
	}
	if got := placedRect(Placement{X: x, Y: y}, 200, 100, area); got != (rect{Left: 400, Top: 200, Right: 600, Bottom: 300}) {
		t.Fatalf("placed %+v", got)
	}
	// Kept inside the area.
	if got := placedRect(Placement{X: 0, Y: 0}, 200, 100, area); got != (rect{Left: 100, Top: 50, Right: 300, Bottom: 150}) {
		t.Fatalf("corner %+v", got)
	}
}
