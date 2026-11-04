// Reads one detected Shop card: which pet its art shows, and whether it's sold
// out. Kept free of path aliases so scripts/ can run it with plain node.
import type { CardRect, Pixels } from "./cardDetection.ts"
import {
    GRID_WIDTH,
    matchCard,
    sampleCard,
    SHOP_LAYOUT,
    type CardMatch,
    type PetPrint,
} from "./cardMatching.ts"

// "Sold Out" sits on a dark band across the art, in card widths.
const BANNER_TOP = 0.8
const BANNER_BOTTOM = 0.98
const TEXT_LEFT = 0.25
const TEXT_RIGHT = 0.75
// The text takes about 6% of that box; a red pet's art takes far more and
// leaves little of it dark.
const MIN_RED_SHARE = 0.02
const MAX_RED_SHARE = 0.15
const MIN_DARK_SHARE = 0.5
// Sample rows the band hides, a little past it on each side.
const BANNER_ROWS = [31, 41] as const
// Matching nudges the sample a whole cell at a time. Busy art (Ashen Agrint)
// can score below the cutoff when the frame falls halfway between cells, so
// the card is also sampled half a cell over, in sample cells.
const SAMPLE_OFFSETS = [0, 0.5] as const

export const isSoldOut = (pixels: Pixels, rect: CardRect) => {
    const channels = pixels.channels ?? 4
    const top = Math.round(rect.y + rect.width * BANNER_TOP)
    const bottom = Math.min(
        pixels.height,
        Math.round(rect.y + rect.width * BANNER_BOTTOM),
    )
    const left = Math.round(rect.x + rect.width * TEXT_LEFT)
    const right = Math.min(
        pixels.width,
        Math.round(rect.x + rect.width * TEXT_RIGHT),
    )
    let red = 0
    let dark = 0
    let total = 0

    for (let y = top; y < bottom; y++) {
        for (let x = left; x < right; x++) {
            const i = (y * pixels.width + x) * channels
            const r = pixels.data[i]
            const g = pixels.data[i + 1]
            const b = pixels.data[i + 2]

            total++

            if (r > 170 && g < 80 && b < 80) {
                red++
            }

            if (Math.max(r, g, b) < 70) {
                dark++
            }
        }
    }

    return (
        total > 0 &&
        red / total >= MIN_RED_SHARE &&
        red / total <= MAX_RED_SHARE &&
        dark / total >= MIN_DARK_SHARE
    )
}

// prints must be built for SHOP_LAYOUT.
export const readShopCard = (
    pixels: Pixels,
    rect: CardRect,
    prints: PetPrint[],
) => {
    const soldOut = isSoldOut(pixels, rect)
    const cell = rect.width / GRID_WIDTH
    let best: CardMatch = { id: 0, score: -Infinity }

    for (const offsetY of SAMPLE_OFFSETS) {
        for (const offsetX of SAMPLE_OFFSETS) {
            const shifted = {
                ...rect,
                x: rect.x + offsetX * cell,
                y: rect.y + offsetY * cell,
            }
            const card = sampleCard(pixels, shifted, SHOP_LAYOUT)
            // Shop art is always in color.
            const [match] = matchCard(
                soldOut ? { ...card, hiddenRows: BANNER_ROWS } : card,
                prints,
                true,
            )

            if (match.score > best.score) best = match
        }
    }

    return { petId: best.id, score: best.score, soldOut: soldOut }
}
