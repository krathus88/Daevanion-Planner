// Reads a detected card: which pet's portrait it shows and its Insight level.
// Our portraits (src/assets/pets) are the same art as the game's cards, cut to
// a square, so a card is matched against every portrait placed where it sits
// on the card. Kept free of path aliases so scripts/ can run it with plain node.
import type { CardRect, Pixels } from "./cardDetection.ts"

// Card samples are this many cells wide; the height follows the card's shape.
const GRID_WIDTH = 40
const GRID_HEIGHT = Math.round(GRID_WIDTH * 1.36)
// The badge and progress bar cover the bottom of the art.
const ART_HEIGHT = Math.round(GRID_HEIGHT * 0.78)

// Where a portrait sits, in card widths: [size, left, top]. The selected or
// equipped card shows its art zoomed in.
const PLACEMENTS = [
    [76 / 60, -8 / 60, 3 / 60],
    [90 / 60, -15 / 60, 1 / 60],
] as const

// Recolored pets share a shape: portraits this close in shape are told apart
// by color instead.
const SAME_SHAPE = 0.08

type PrintPoint = {
    x: number
    y: number
    gray: number
    chroma: [number, number, number]
}

export type PetPrint = {
    id: number
    // One point list per placement.
    placements: PrintPoint[][]
}

export type CardSample = {
    rgb: Float32Array
    gray: Float32Array
}

export type CardMatch = {
    id: number
    // Shape correlation, 1 is a perfect match.
    score: number
}

type PlacementScore = {
    shape: number
    colorGap: number
}

const toGray = (r: number, g: number, b: number) =>
    r * 0.3 + g * 0.59 + b * 0.11

const toChroma = (
    r: number,
    g: number,
    b: number,
): [number, number, number] => {
    const sum = r + g + b + 1

    return [r / sum, g / sum, b / sum]
}

// Portrait sizes to draw for buildPetPrint, one per placement.
export const getPortraitSizes = () => {
    return PLACEMENTS.map(([size]) => Math.round(size * GRID_WIDTH))
}

export const buildPetPrint = (id: number, portraits: Pixels[]): PetPrint => {
    return {
        id,
        placements: PLACEMENTS.map(([, left, top], index) => {
            const portrait = portraits[index]
            const channels = portrait.channels ?? 4
            const offsetX = Math.round(left * GRID_WIDTH)
            const offsetY = Math.round(top * GRID_WIDTH)
            const points: PrintPoint[] = []

            for (let y = 0; y < portrait.height; y++) {
                for (let x = 0; x < portrait.width; x++) {
                    const i = (y * portrait.width + x) * channels
                    const cardX = x + offsetX
                    const cardY = y + offsetY
                    const { data } = portrait

                    if (channels === 4 && data[i + 3] < 200) continue
                    if (cardX < 0 || cardX >= GRID_WIDTH) continue
                    if (cardY < 0 || cardY >= ART_HEIGHT) continue

                    points.push({
                        x: cardX,
                        y: cardY,
                        gray: toGray(data[i], data[i + 1], data[i + 2]),
                        chroma: toChroma(data[i], data[i + 1], data[i + 2]),
                    })
                }
            }

            return points
        }),
    }
}

// Averages the card's pixels into a GRID_WIDTH x GRID_HEIGHT grid.
export const sampleCard = (pixels: Pixels, rect: CardRect): CardSample => {
    const channels = pixels.channels ?? 4
    const rgb = new Float32Array(GRID_WIDTH * GRID_HEIGHT * 3)
    const gray = new Float32Array(GRID_WIDTH * GRID_HEIGHT)
    const cell = rect.width / GRID_WIDTH

    for (let gy = 0; gy < GRID_HEIGHT; gy++) {
        for (let gx = 0; gx < GRID_WIDTH; gx++) {
            const x0 = Math.floor(rect.x + gx * cell)
            const y0 = Math.floor(rect.y + gy * cell)
            const x1 = Math.max(x0 + 1, Math.floor(rect.x + (gx + 1) * cell))
            const y1 = Math.max(y0 + 1, Math.floor(rect.y + (gy + 1) * cell))
            let r = 0
            let g = 0
            let b = 0
            let count = 0

            for (let y = y0; y < Math.min(y1, pixels.height); y++) {
                for (let x = x0; x < Math.min(x1, pixels.width); x++) {
                    const i = (y * pixels.width + x) * channels

                    r += pixels.data[i]
                    g += pixels.data[i + 1]
                    b += pixels.data[i + 2]
                    count++
                }
            }

            const cellIndex = gy * GRID_WIDTH + gx

            count = Math.max(count, 1)
            rgb[cellIndex * 3] = r / count
            rgb[cellIndex * 3 + 1] = g / count
            rgb[cellIndex * 3 + 2] = b / count
            gray[cellIndex] = toGray(r / count, g / count, b / count)
        }
    }

    return { rgb, gray }
}

const scorePlacement = (
    card: CardSample,
    points: PrintPoint[],
    shiftX: number,
    shiftY: number,
): PlacementScore => {
    let n = 0
    let sumA = 0
    let sumB = 0
    let sumAA = 0
    let sumBB = 0
    let sumAB = 0
    let colorGap = 0

    for (const point of points) {
        const x = point.x + shiftX
        const y = point.y + shiftY

        if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= ART_HEIGHT) continue

        const cell = y * GRID_WIDTH + x
        const a = point.gray
        const b = card.gray[cell]
        const [r, g, bl] = toChroma(
            card.rgb[cell * 3],
            card.rgb[cell * 3 + 1],
            card.rgb[cell * 3 + 2],
        )

        n++
        sumA += a
        sumB += b
        sumAA += a * a
        sumBB += b * b
        sumAB += a * b
        colorGap +=
            Math.abs(r - point.chroma[0]) +
            Math.abs(g - point.chroma[1]) +
            Math.abs(bl - point.chroma[2])
    }

    // Thin portraits still need enough art to compare.
    if (n < GRID_WIDTH * 2) return { shape: -1, colorGap: Infinity }

    const covariance = sumAB / n - (sumA / n) * (sumB / n)
    const varianceA = sumAA / n - (sumA / n) ** 2
    const varianceB = sumBB / n - (sumB / n) ** 2

    return {
        shape: covariance / Math.sqrt(varianceA * varianceB + 1e-6),
        colorGap: colorGap / n,
    }
}

const scorePrint = (card: CardSample, print: PetPrint, shift: number) => {
    let best: PlacementScore = { shape: -1, colorGap: Infinity }

    for (const points of print.placements) {
        for (let dy = -shift; dy <= shift; dy++) {
            for (let dx = -shift; dx <= shift; dx++) {
                const score = scorePlacement(card, points, dx, dy)

                if (score.shape > best.shape) best = score
            }
        }
    }

    return best
}

// Best pets first. A cheap pass ranks every pet by shape, the closest few are
// checked again with the card nudged a cell either way, and pets of the same
// shape are then ordered by color unless the card is a grey locked one.
export const matchCard = (
    card: CardSample,
    prints: PetPrint[],
    colored: boolean,
): CardMatch[] => {
    const close = prints
        .map((print) => ({ print, shape: scorePrint(card, print, 0).shape }))
        .sort((a, b) => b.shape - a.shape)
        .slice(0, 6)
        .map(({ print }) => ({ id: print.id, ...scorePrint(card, print, 1) }))
        .sort((a, b) => b.shape - a.shape)

    const best = close[0].shape
    const sameShape = close.filter((match) => best - match.shape < SAME_SHAPE)
    const others = close.slice(sameShape.length)

    if (colored) sameShape.sort((a, b) => a.colorGap - b.colorGap)

    return [...sameShape, ...others].map((match) => ({
        id: match.id,
        score: match.shape,
    }))
}

// The card's Insight level, 0 when locked. The level badge is a circle centred
// just inside the card's bottom-left corner: a cyan digit for Lv3, white for
// Lv1-2, none while locked.
export const readLevel = (pixels: Pixels, rect: CardRect) => {
    const channels = pixels.channels ?? 4
    const centerX = rect.x + rect.width * 0.03
    const centerY = rect.y + rect.width * 1.27
    const half = rect.width * 0.065
    let cyan = 0
    let white = 0
    let minX = Infinity
    let maxX = -Infinity
    let total = 0

    for (let y = Math.round(centerY - half); y <= centerY + half; y++) {
        for (let x = Math.round(centerX - half); x <= centerX + half; x++) {
            if (x < 0 || y < 0 || x >= pixels.width || y >= pixels.height) {
                continue
            }

            const i = (y * pixels.width + x) * channels
            const r = pixels.data[i]
            const g = pixels.data[i + 1]
            const b = pixels.data[i + 2]

            total++

            if (g > 150 && b > 150 && r < 130) {
                cyan++
            } else if (r > 170 && g > 170 && b > 170) {
                white++
                minX = Math.min(minX, x)
                maxX = Math.max(maxX, x)
            }
        }
    }

    const minimum = Math.max(4, total * 0.03)

    if (cyan > minimum) return 3
    if (white < minimum) return 0

    // "1" is a narrow stroke, "2" spans most of the circle.
    return (maxX - minX) / (half * 2) < 0.4 ? 1 : 2
}
