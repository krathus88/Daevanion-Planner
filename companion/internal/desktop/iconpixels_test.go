package desktop

import (
	"image"
	"image/color"
	"testing"
)

func solid(size int, c color.RGBA) image.Image {
	img := image.NewRGBA(image.Rect(0, 0, size, size))
	for i := 0; i < len(img.Pix); i += 4 {
		img.Pix[i], img.Pix[i+1], img.Pix[i+2], img.Pix[i+3] = c.R, c.G, c.B, c.A
	}
	return img
}

func TestIconPixelsShrinksAndRounds(t *testing.T) {
	px := iconPixels(solid(64, color.RGBA{R: 200, G: 100, B: 50, A: 255}), 40, 8)
	if len(px) != 40*40*4 {
		t.Fatalf("got %d bytes", len(px))
	}
	pixel := func(x, y int) []byte { return px[(y*40+x)*4 : (y*40+x)*4+4] }
	// The middle keeps the color, as BGRA.
	if got := pixel(20, 20); got[0] != 50 || got[1] != 100 || got[2] != 200 || got[3] != 255 {
		t.Fatalf("middle %v", got)
	}
	// The corner is cut away, its edge half covered (premultiplied).
	if got := pixel(0, 0); got[3] != 0 {
		t.Fatalf("corner %v", got)
	}
	if got := pixel(2, 1); got[3] == 0 || got[3] == 255 || got[2] > got[3] {
		t.Fatalf("edge %v", got)
	}
}

func TestIconPixelsWithoutAnIcon(t *testing.T) {
	px := iconPixels(nil, 10, 2)
	for _, b := range px {
		if b != 0 {
			t.Fatal("drew something from nothing")
		}
	}
}

func TestComposeOverlay(t *testing.T) {
	const w, h = 20, 10
	bg := uint32(0x30221d) // #1d2230
	black := make([]byte, w*h*4)
	white := make([]byte, w*h*4)
	for i := 0; i < len(white); i += 4 {
		white[i], white[i+1], white[i+2] = 255, 255, 255
	}
	// A solid text pixel, and a half-covered edge pixel of white text.
	text := (5*w + 10) * 4
	black[text], black[text+1], black[text+2] = 0xf1, 0xeb, 0xe9
	white[text], white[text+1], white[text+2] = 0xf1, 0xeb, 0xe9
	edge := (5*w + 11) * 4
	black[edge], black[edge+1], black[edge+2] = 128, 128, 128
	composeOverlay(black, white, w, h, 4, bg, 0, nil)

	if black[text+3] != 255 || black[text] != 0xf1 {
		t.Fatalf("text not solid: %v", black[text:text+4])
	}
	// At 0% background the edge is half see-through white, not dark.
	if black[edge+3] != 128 || black[edge] != 128 {
		t.Fatalf("edge %v", black[edge:edge+4])
	}
	back := (5*w + 15) * 4
	if black[back+3] != 0 {
		t.Fatalf("background %v", black[back:back+4])
	}
}

func TestComposeOverlayBackground(t *testing.T) {
	const w, h = 20, 10
	black := make([]byte, w*h*4)
	white := make([]byte, w*h*4)
	for i := 0; i < len(white); i += 4 {
		white[i], white[i+1], white[i+2] = 255, 255, 255
	}
	composeOverlay(black, white, w, h, 4, 0x30221d, 128, nil)
	back := (5*w + 15) * 4
	// #1d2230 premultiplied by 128/255: R 0x1d -> 15.
	if black[back+3] != 128 || black[back+2] != 15 || black[back] != 24 {
		t.Fatalf("background %v", black[back:back+4])
	}
	if black[3] != 0 {
		t.Fatalf("corner not cut: %v", black[0:4])
	}
}

// Faded content is fainter over the full background.
func TestComposeOverlayFades(t *testing.T) {
	const w, h = 20, 10
	black := make([]byte, w*h*4)
	white := make([]byte, w*h*4)
	for i := 0; i < len(white); i += 4 {
		white[i], white[i+1], white[i+2] = 255, 255, 255
	}
	text := (5*w + 10) * 4
	for _, px := range [][]byte{black, white} {
		px[text], px[text+1], px[text+2] = 200, 200, 200
	}
	composeOverlay(black, white, w, h, 4, 0, 0, []fadeRect{{8, 4, 12, 6, 0.5}})
	if black[text+3] != 128 || black[text] != 100 {
		t.Fatalf("faded %v", black[text:text+4])
	}
}

func TestOpacityByte(t *testing.T) {
	if OpacityByte(0) != 0 || OpacityByte(100) != 255 || OpacityByte(50) != 128 || OpacityByte(150) != 255 || OpacityByte(-3) != 0 {
		t.Fatal("wrong bytes")
	}
}
