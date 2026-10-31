// Finds the pet cards in a screenshot of the game Shop's Pets tab. The cards
// hang at uneven heights over a busy backdrop, so they're found by their
// frames instead: every card is outlined by two thin light vertical lines.
// Kept free of path aliases so scripts/ can run it with plain node.
import type { CardRect, Pixels } from "./cardDetection.ts"

// A frame line is this much brighter than the pixels a few columns away.
const LINE_CONTRAST = 20
// Rows a line may skip before it counts as broken.
const MAX_GAP = 3
const MIN_LINE_LENGTH = 20
// Pieces of one line, split where a tag or the cursor crosses it, join
// across a gap this long.
const MAX_JOIN_GAP = 12
// A frame side is about 1.33 card widths long; tags and the cursor can hide
// part of either side.
const MIN_SIDE_SHARE = 0.3
const MIN_LONGER_SIDE_SHARE = 0.6
const MAX_SIDE_SHARE = 1.8
// Every card is the same width, within this share.
const WIDTH_TOLERANCE = 0.04
// Share of the frame's width its top edge must show along.
const MIN_TOP_EDGE = 0.6
// Cards hang at uneven heights: a card this many card widths below the first
// of its row starts a new row.
const ROW_REACH = 0.75

type Line = {
    x: number
    top: number
    bottom: number
}

type Pair = {
    left: Line
    right: Line
    width: number
    overlap: number
}

const getBrightness = (pixels: Pixels, x: number, y: number) => {
    const i = (y * pixels.width + x) * (pixels.channels ?? 4)
    const { data } = pixels

    return Math.max(data[i], data[i + 1], data[i + 2])
}

// A line one or two pixels wide that stands out from both sides.
const isLinePixel = (pixels: Pixels, x: number, y: number) => {
    const line = Math.max(
        getBrightness(pixels, x, y),
        getBrightness(pixels, x + 1, y),
    )
    const sides = Math.max(
        getBrightness(pixels, x - 3, y),
        getBrightness(pixels, x - 2, y),
        getBrightness(pixels, x + 2, y),
        getBrightness(pixels, x + 3, y),
    )

    return line - sides > LINE_CONTRAST
}

// A line one or two pixels high, as in the frame's top edge.
const isEdgePixel = (pixels: Pixels, x: number, y: number) => {
    const line = Math.max(
        getBrightness(pixels, x, y),
        getBrightness(pixels, x, y + 1),
    )
    const sides = Math.max(
        getBrightness(pixels, x, y - 3),
        getBrightness(pixels, x, y - 2),
        getBrightness(pixels, x, y + 2),
        getBrightness(pixels, x, y + 3),
    )

    return line - sides > LINE_CONTRAST
}

// Two sides are one card's when its top edge joins them. Lines of two
// neighbouring cards can look like a card, but nothing joins them.
const hasTopEdge = (pixels: Pixels, left: Line, right: Line) => {
    const top = Math.min(left.top, right.top)
    const reach = Math.max(4, Math.round((right.x - left.x) * 0.04))
    let found = 0

    for (let x = left.x + 2; x < right.x - 1; x++) {
        for (let y = top - reach; y <= top + reach; y++) {
            if (y < 3 || y >= pixels.height - 4) continue

            if (isEdgePixel(pixels, x, y)) {
                found++
                break
            }
        }
    }

    return found >= (right.x - left.x - 3) * MIN_TOP_EDGE
}

const findColumnLines = (pixels: Pixels, x: number) => {
    const lines: Line[] = []
    let top = -1
    let gap = 0

    for (let y = 0; y <= pixels.height; y++) {
        if (y < pixels.height && isLinePixel(pixels, x, y)) {
            if (top < 0) top = y
            gap = 0
        } else if (top >= 0 && (y === pixels.height || ++gap > MAX_GAP)) {
            const bottom = y - gap

            if (bottom - top >= MIN_LINE_LENGTH) {
                lines.push({ x: x, top: top, bottom: bottom })
            }

            top = -1
            gap = 0
        }
    }

    return lines
}

// Pieces in the same or a neighbouring column that touch or nearly do are one
// line. Lines come in column order.
const mergeLines = (lines: Line[]) => {
    const merged: Line[] = []

    for (const line of lines) {
        const same = merged.find((other) => {
            return (
                line.x - other.x <= 2 &&
                line.top <= other.bottom + MAX_JOIN_GAP &&
                other.top <= line.bottom + MAX_JOIN_GAP
            )
        })

        if (same) {
            same.x = line.x
            same.top = Math.min(same.top, line.top)
            same.bottom = Math.max(same.bottom, line.bottom)
        } else {
            merged.push({ ...line })
        }
    }

    return merged
}

const getLength = (line: Line) => {
    return line.bottom - line.top
}

// Every two lines that could be the sides of one card.
const findPairs = (pixels: Pixels, lines: Line[]) => {
    const pairs: Pair[] = []

    for (const left of lines) {
        for (const right of lines) {
            const width = right.x - left.x

            if (width <= 0) continue

            const shorter = Math.min(getLength(left), getLength(right))
            const longer = Math.max(getLength(left), getLength(right))
            const overlap =
                Math.min(left.bottom, right.bottom) -
                Math.max(left.top, right.top)

            if (shorter < width * MIN_SIDE_SHARE) continue
            if (longer < width * MIN_LONGER_SIDE_SHARE) continue
            if (longer > width * MAX_SIDE_SHARE) continue
            if (overlap < shorter * 0.6) continue
            if (!hasTopEdge(pixels, left, right)) continue

            pairs.push({
                left: left,
                right: right,
                width: width,
                overlap: overlap,
            })
        }
    }

    return pairs
}

// The width the most frame line agrees on: the real cards, while chance pairs of
// unrelated lines each have a width of their own. Lines inside the cards
// repeat too, but the frame's sides are the longest.
const findCardWidth = (pairs: Pair[]) => {
    let best = 0
    let bestWeight = 0

    for (const pair of pairs) {
        let weight = 0

        for (const other of pairs) {
            if (
                Math.abs(other.width - pair.width) <=
                pair.width * WIDTH_TOLERANCE
            ) {
                weight += other.overlap
            }
        }

        if (weight > bestWeight) {
            best = pair.width
            bestWeight = weight
        }
    }

    return best
}

// Left to right, top to bottom.
const sortByRows = (cards: CardRect[]) => {
    const byTop = [...cards].sort((a, b) => a.y - b.y)
    const sorted: CardRect[] = []
    let row: CardRect[] = []

    const closeRow = () => {
        sorted.push(...row.sort((a, b) => a.x - b.x))
        row = []
    }

    for (const card of byTop) {
        if (row.length > 0 && card.y - row[0].y > card.width * ROW_REACH) {
            closeRow()
        }

        row.push(card)
    }

    closeRow()

    return sorted
}

// Card rects start at the frame's top-left corner and are as tall as wide;
// cardMatching's shop layout says where the art sits in them.
export const detectShopCards = (pixels: Pixels): CardRect[] => {
    const found: Line[] = []

    for (let x = 3; x < pixels.width - 4; x++) {
        found.push(...findColumnLines(pixels, x))
    }

    const pairs = findPairs(pixels, mergeLines(found))
    const width = findCardWidth(pairs)
    const used = new Set<Line>()
    const cards: CardRect[] = []

    // Pairs whose sides overlap most are surest, so they claim lines first.
    const sized = pairs
        .filter((pair) => {
            return Math.abs(pair.width - width) <= width * WIDTH_TOLERANCE
        })
        .sort((a, b) => b.overlap - a.overlap)

    for (const { left, right } of sized) {
        if (used.has(left) || used.has(right)) continue

        used.add(left)
        used.add(right)
        cards.push({
            x: left.x,
            y: Math.min(left.top, right.top),
            width: right.x - left.x,
            height: right.x - left.x,
        })
    }

    return sortByRows(cards)
}
