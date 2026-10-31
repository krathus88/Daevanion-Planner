// Reads a card's soul counter ("40/75") and the bar under it. Art shows behind
// the text and the badge covers the bar's start, so neither is enough alone:
// the bar narrows down the value, then the digits settle it. Sizes are in cells
// of a card 107 cells wide, the size the digits were taken at.
// Kept free of path aliases so scripts/ can run it with plain node.
import type { CardRect, Pixels } from "./cardDetection.ts"
import { SOUL_DIGITS } from "./soulDigits.ts"

const CARD_CELLS = 107
const DIGIT_WIDTH = 8
const DIGIT_HEIGHT = 12
const TEXT_TOP = 122
// Where a digit starts: the counter's right end stays put, so the tens and
// units sit in the same place whatever the number is.
const TENS_LEFT = 62
const UNITS_LEFT = 70
// The first digit after the slash: "/25" is Lv1 and "/75" is Lv2.
const NEEDED_LEFT = 84
// The "5" that ends "/25" and "/75" tells how the card's text sits.
const ANCHOR_LEFT = 92
const ANCHOR_REACH_X = 2
const ANCHOR_REACH_Y = 3
const MIN_ANCHOR_SCORE = 0.5

// The selected card draws this much bigger, framed in a bright line just
// outside the card; other cards have a dark gap there.
const SELECTED_ZOOM = 1.06
const FRAME_LEFT = -4
const FRAME_RIGHT = -1
const FRAME_TOP = 20
const FRAME_BOTTOM = 110
const FRAME_BRIGHTNESS = 70
const FRAME_SHARE = 0.6

const BAR_LEFT = 9
const BAR_WIDTH = 88
// The level badge hides the bar up to about here; its edge moves a little.
const BADGE_RIGHT = 20
const BADGE_REACH = 6
const BAR_TOP = 134
const BAR_ROWS = 5
const BAR_MIN_ROWS = 2

// Below this the digits aren't believed over the bar.
const MIN_DIGIT_SCORE = 0.55
// How much worse the digits look per soul away from the bar.
const BAR_GAP_COST = 0.03
// Two values this close in score can't be told apart.
const CLOSE_CALL = 0.04
// The counter's 2 and 7 this close leave the level to the badge.
const LEVEL_MARGIN = 0.1
// A digit this clear in the tens' place rules out a one-digit number.
const TENS_SCORE = 0.75
// Cards narrower than this, in pixels, blur their digits together.
const MIN_CARD_WIDTH = 80

export type SoulReading = {
    // Souls towards the next level.
    progress: number
    // The digits didn't read clearly, so the value may be a little off.
    unsure: boolean
}

const toDigitCells = (rows: string[]) => {
    const cells = new Float32Array(DIGIT_WIDTH * DIGIT_HEIGHT)

    rows.forEach((row, y) => {
        for (let x = 0; x < DIGIT_WIDTH; x++) {
            cells[y * DIGIT_WIDTH + x] = parseInt(row[x], 16)
        }
    })

    return cells
}

const DIGITS = SOUL_DIGITS.map(toDigitCells)

// A cell's color, weighing each pixel by how much of it the cell covers, so
// cards smaller than the digits' size still blend like the digits did.
const samplePixel = (
    pixels: Pixels,
    rect: CardRect,
    cellX: number,
    cellY: number,
) => {
    const cell = rect.width / CARD_CELLS
    const channels = pixels.channels ?? 4
    const left = rect.x + cellX * cell
    const top = rect.y + cellY * cell
    let r = 0
    let g = 0
    let b = 0
    let weight = 0

    for (let y = Math.floor(top); y < top + cell; y++) {
        if (y < 0 || y >= pixels.height) continue

        const coverY = Math.min(y + 1, top + cell) - Math.max(y, top)

        for (let x = Math.floor(left); x < left + cell; x++) {
            if (x < 0 || x >= pixels.width) continue

            const i = (y * pixels.width + x) * channels
            const cover =
                coverY * (Math.min(x + 1, left + cell) - Math.max(x, left))

            r += pixels.data[i] * cover
            g += pixels.data[i + 1] * cover
            b += pixels.data[i + 2] * cover
            weight += cover
        }
    }

    weight = Math.max(weight, 1e-6)

    return [r / weight, g / weight, b / weight]
}

const sampleDigitBox = (
    pixels: Pixels,
    rect: CardRect,
    left: number,
    top: number,
) => {
    const gray = new Float32Array(DIGIT_WIDTH * DIGIT_HEIGHT)

    for (let y = 0; y < DIGIT_HEIGHT; y++) {
        for (let x = 0; x < DIGIT_WIDTH; x++) {
            const [r, g, b] = samplePixel(pixels, rect, left + x, top + y)

            gray[y * DIGIT_WIDTH + x] = r * 0.3 + g * 0.59 + b * 0.11
        }
    }

    return gray
}

// Correlation, 1 is a perfect match; brightness behind the text doesn't count.
const scoreBox = (box: Float32Array, digit: Float32Array) => {
    const n = box.length
    let sumA = 0
    let sumB = 0
    let sumAA = 0
    let sumBB = 0
    let sumAB = 0

    for (let i = 0; i < n; i++) {
        sumA += box[i]
        sumB += digit[i]
        sumAA += box[i] * box[i]
        sumBB += digit[i] * digit[i]
        sumAB += box[i] * digit[i]
    }

    const covariance = sumAB / n - (sumA / n) * (sumB / n)
    const varianceA = sumAA / n - (sumA / n) ** 2
    const varianceB = sumBB / n - (sumB / n) ** 2

    return covariance / Math.sqrt(varianceA * varianceB + 1e-6)
}

const findAnchor = (pixels: Pixels, rect: CardRect) => {
    let best = { x: 0, y: 0, score: -1 }

    for (let y = -ANCHOR_REACH_Y; y <= ANCHOR_REACH_Y; y++) {
        for (let x = -ANCHOR_REACH_X; x <= ANCHOR_REACH_X; x++) {
            const box = sampleDigitBox(
                pixels,
                rect,
                ANCHOR_LEFT + x,
                TEXT_TOP + y,
            )
            const score = scoreBox(box, DIGITS[5])

            if (score > best.score) {
                best = { x: x, y: y, score: score }
            }
        }
    }

    return best
}

const isBarColor = (r: number, g: number, b: number) => {
    return r > 170 && g > 150 && r - b > 40
}

const isBarColumn = (
    pixels: Pixels,
    rect: CardRect,
    x: number,
    top: number,
) => {
    let filled = 0

    for (let row = 0; row < BAR_ROWS; row++) {
        const [r, g, b] = samplePixel(pixels, rect, x, top + row)

        if (isBarColor(r, g, b)) filled++
    }

    return filled >= BAR_MIN_ROWS
}

// Where the bar's fill ends, in cells; null when none of it shows.
const findBarEnd = (
    pixels: Pixels,
    rect: CardRect,
    start: number,
    top: number,
) => {
    let x = start

    while (x < start + BADGE_REACH && !isBarColumn(pixels, rect, x, top)) {
        x++
    }

    if (x === start + BADGE_REACH) return null

    while (x < BAR_LEFT + BAR_WIDTH && isBarColumn(pixels, rect, x, top)) {
        x++
    }

    return x
}

// The digit's best match with the text nudged a cell either way.
const scoreDigit = (
    pixels: Pixels,
    rect: CardRect,
    digit: number,
    left: number,
    top: number,
) => {
    let best = -1

    for (let y = -1; y <= 1; y++) {
        for (let x = -1; x <= 1; x++) {
            const box = sampleDigitBox(pixels, rect, left + x, top + y)

            best = Math.max(best, scoreBox(box, DIGITS[digit]))
        }
    }

    return best
}

// Whether the tens' place shows a digit; a 0 can't lead the number.
const hasTensDigit = (
    pixels: Pixels,
    rect: CardRect,
    anchor: { x: number; y: number },
) => {
    for (let digit = 1; digit <= 7; digit++) {
        const score = scoreDigit(
            pixels,
            rect,
            digit,
            TENS_LEFT + anchor.x,
            TEXT_TOP + anchor.y,
        )

        if (score > TENS_SCORE) return true
    }

    return false
}

const scoreNumber = (
    pixels: Pixels,
    rect: CardRect,
    value: number,
    anchor: { x: number; y: number },
) => {
    const top = TEXT_TOP + anchor.y
    const parts = [{ digit: value % 10, left: UNITS_LEFT + anchor.x }]

    if (value >= 10) {
        parts.push({
            digit: Math.floor(value / 10),
            left: TENS_LEFT + anchor.x,
        })
    }

    let total = 0

    for (const part of parts) {
        total += scoreDigit(pixels, rect, part.digit, part.left, top)
    }

    return total / parts.length
}

const isSelectedCard = (pixels: Pixels, rect: CardRect) => {
    let bright = 0

    for (let y = FRAME_TOP; y < FRAME_BOTTOM; y++) {
        let brightest = 0

        for (let x = FRAME_LEFT; x <= FRAME_RIGHT; x++) {
            const [r, g, b] = samplePixel(pixels, rect, x, y)

            brightest = Math.max(brightest, r, g, b)
        }

        if (brightest > FRAME_BRIGHTNESS) bright++
    }

    return bright / (FRAME_BOTTOM - FRAME_TOP) > FRAME_SHARE
}

// The card as drawn: the selected one grows around its center.
const fitCard = (pixels: Pixels, rect: CardRect): CardRect => {
    if (!isSelectedCard(pixels, rect)) {
        return rect
    }

    const grow = SELECTED_ZOOM - 1

    return {
        x: rect.x - (rect.width * grow) / 2,
        y: rect.y - (rect.height * grow) / 2,
        width: rect.width * SELECTED_ZOOM,
        height: rect.height * SELECTED_ZOOM,
    }
}

// The level of a card with a Lv1 or Lv2 badge. The counter's "/25" or "/75" is
// clearer than the badge's digit on small cards; an unreadable one leaves the
// badge's answer.
export const readCounterLevel = (
    pixels: Pixels,
    cardRect: CardRect,
    badgeLevel: number,
) => {
    const rect = fitCard(pixels, cardRect)
    const anchor = findAnchor(pixels, rect)
    const left = NEEDED_LEFT + anchor.x
    const top = TEXT_TOP + anchor.y
    const two = scoreDigit(pixels, rect, 2, left, top)
    const seven = scoreDigit(pixels, rect, 7, left, top)

    if (
        anchor.score < MIN_ANCHOR_SCORE ||
        Math.max(two, seven) < MIN_DIGIT_SCORE ||
        Math.abs(two - seven) < LEVEL_MARGIN
    ) {
        return badgeLevel
    }

    return seven > two ? 2 : 1
}

// A locked card has no badge, and its "/5" counter isn't where the others are;
// five steps are wide enough for the bar alone.
export const readLockedProgress = (
    pixels: Pixels,
    rect: CardRect,
    needed: number,
): SoulReading => {
    const end = findBarEnd(pixels, rect, BAR_LEFT, BAR_TOP)
    const filled = end === null ? 0 : (end - BAR_LEFT) / BAR_WIDTH

    return {
        progress: Math.min(Math.round(filled * needed), needed - 1),
        unsure: false,
    }
}

// needed: the souls this card's level takes, the number after the slash.
export const readProgress = (
    pixels: Pixels,
    cardRect: CardRect,
    needed: number,
): SoulReading => {
    const rect = fitCard(pixels, cardRect)
    const anchor = findAnchor(pixels, rect)
    const barEnd = findBarEnd(
        pixels,
        rect,
        BADGE_RIGHT - 2,
        BAR_TOP + Math.max(anchor.y, 0),
    )
    const perCell = needed / BAR_WIDTH
    const barValue =
        barEnd === null ? null : Math.round((barEnd - BAR_LEFT) * perCell)
    // Bar cells are coarse at /75, so the digits get a few values to pick from.
    const reach = Math.max(1, Math.ceil(perCell * 2))
    const lowest = barValue === null ? 0 : Math.max(barValue - reach, 0)
    const highest =
        barValue === null
            ? Math.ceil((BADGE_RIGHT - BAR_LEFT) * perCell) + 1
            : Math.min(barValue + reach, needed - 1)
    // With the bar hidden, 3 and 13 are told apart by the tens' place.
    const twoDigits = barValue === null && hasTensDigit(pixels, rect, anchor)
    const start = twoDigits ? 10 : lowest
    const stop =
        barValue === null && !twoDigits ? Math.min(highest, 9) : highest
    let best = start
    let bestScore = -Infinity
    let nextScore = -Infinity

    for (let value = start; value <= stop; value++) {
        // A visible bar breaks close calls: it's rarely more than a soul off.
        const barGap = barValue === null ? 0 : Math.abs(value - barValue)
        const score =
            scoreNumber(pixels, rect, value, anchor) - barGap * BAR_GAP_COST

        if (score > bestScore) {
            best = value
            nextScore = bestScore
            bestScore = score
        } else if (score > nextScore) {
            nextScore = score
        }
    }

    const unsure =
        rect.width < MIN_CARD_WIDTH ||
        anchor.score < MIN_ANCHOR_SCORE ||
        bestScore < MIN_DIGIT_SCORE ||
        bestScore - nextScore < CLOSE_CALL

    return {
        progress: unsure && barValue !== null ? barValue : best,
        unsure: unsure,
    }
}
