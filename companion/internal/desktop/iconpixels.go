package desktop

import (
	"image"
	"math"
)

// iconSamples is the supersampling per axis when shrinking an icon: enough
// for a 64px portrait drawn at 40-60px.
const iconSamples = 4

// iconPixels shrinks (or grows) img to size x size with rounded corners of
// the given radius, as premultiplied BGRA rows top to bottom: what GDI's
// AlphaBlend takes. Each pixel averages iconSamples² points of the source.
func iconPixels(img image.Image, size, radius int) []byte {
	out := make([]byte, size*size*4)
	if img == nil || size <= 0 {
		return out
	}
	b := img.Bounds()
	scaleX := float64(b.Dx()) / float64(size)
	scaleY := float64(b.Dy()) / float64(size)
	const n = iconSamples
	for y := 0; y < size; y++ {
		for x := 0; x < size; x++ {
			var r, g, bl, a, inside float64
			for sy := 0; sy < n; sy++ {
				for sx := 0; sx < n; sx++ {
					// The sample's spot in the icon, in output pixels.
					fx := float64(x) + (float64(sx)+0.5)/n
					fy := float64(y) + (float64(sy)+0.5)/n
					if !inRoundRect(fx, fy, float64(size), float64(radius)) {
						continue
					}
					inside++
					px := b.Min.X + min(b.Dx()-1, int(fx*scaleX))
					py := b.Min.Y + min(b.Dy()-1, int(fy*scaleY))
					// Premultiplied, 16 bits per channel.
					cr, cg, cb, ca := img.At(px, py).RGBA()
					r += float64(cr)
					g += float64(cg)
					bl += float64(cb)
					a += float64(ca)
				}
			}
			if inside == 0 {
				continue
			}
			total := float64(n * n)
			at := (y*size + x) * 4
			out[at] = byte(math.Round(bl / total / 257))
			out[at+1] = byte(math.Round(g / total / 257))
			out[at+2] = byte(math.Round(r / total / 257))
			out[at+3] = byte(math.Round(a / total / 257))
		}
	}
	return out
}

// inRoundRect says whether (x, y) lies in a size x size square with corners
// rounded by radius.
func inRoundRect(x, y, size, radius float64) bool {
	cx := math.Max(radius, math.Min(size-radius, x))
	cy := math.Max(radius, math.Min(size-radius, y))
	dx, dy := x-cx, y-cy
	return dx*dx+dy*dy <= radius*radius
}

// composeOverlay turns an overlay's content, drawn twice by GDI (once on
// black, once on white; GDI leaves the alpha byte alone), into premultiplied
// pixels for UpdateLayeredWindow, written into black. Where the two differ
// the content is see-through (the smoothed edges of text): that sets each
// pixel's own alpha, so text keeps clean edges over the game instead of a
// dark fringe. Under the content lies the background color (bg, a COLORREF
// 0x00BBGGRR) at bgAlpha, and the corners are rounded by radius, smoothed
// at the edge. Content inside one of fades is drawn at its strength (0-1)
// over the full background.
func composeOverlay(black, white []byte, width, height, radius int, bg uint32, bgAlpha byte, fades []fadeRect) {
	bgColor := [3]float64{float64(byte(bg >> 16)), float64(byte(bg >> 8)), float64(byte(bg))} // B, G, R
	back := float64(bgAlpha) / 255
	const n = iconSamples
	for y := 0; y < height; y++ {
		for x := 0; x < width; x++ {
			at := (y*width + x) * 4
			// The content's alpha: 1 minus how much of the white shows through.
			through := 0.0
			for c := 0; c < 3; c++ {
				through += float64(int(white[at+c]) - int(black[at+c]))
			}
			a := math.Max(0, math.Min(1, 1-through/3/255))
			strength := 1.0
			for _, f := range fades {
				if int32(x) >= f.left && int32(x) < f.right && int32(y) >= f.top && int32(y) < f.bottom {
					strength = f.strength
				}
			}
			a *= strength
			coverage := 1.0
			// Only pixels near a corner can be cut.
			nearX := x < radius || x >= width-radius
			nearY := y < radius || y >= height-radius
			if nearX && nearY {
				inside := 0
				for sy := 0; sy < n; sy++ {
					for sx := 0; sx < n; sx++ {
						fx := float64(x) + (float64(sx)+0.5)/n
						fy := float64(y) + (float64(sy)+0.5)/n
						if inRoundRectWH(fx, fy, float64(width), float64(height), float64(radius)) {
							inside++
						}
					}
				}
				coverage = float64(inside) / (n * n)
			}
			under := back * (1 - a)
			for c := 0; c < 3; c++ {
				// On black, the content is already premultiplied.
				content := math.Min(float64(black[at+c])*strength, a*255)
				black[at+c] = byte(math.Round((content + bgColor[c]*under) * coverage))
			}
			black[at+3] = byte(math.Round((a + under) * 255 * coverage))
		}
	}
}

// fadeRect draws an overlay's content from (left, top) up to (right,
// bottom) at strength (0-1).
type fadeRect struct {
	left, top, right, bottom int32
	strength                 float64
}

// inRoundRectWH is inRoundRect for a width x height rectangle.
func inRoundRectWH(x, y, width, height, radius float64) bool {
	cx := math.Max(radius, math.Min(width-radius, x))
	cy := math.Max(radius, math.Min(height-radius, y))
	dx, dy := x-cx, y-cy
	return dx*dx+dy*dy <= radius*radius
}

// OpacityByte is a 0-100 percent as 0-255.
func OpacityByte(percent int) byte {
	percent = max(0, min(100, percent))
	return byte(math.Round(float64(percent) * 255 / 100))
}
