import { describe, expect, it } from "vitest"
import { fillRect, makePixels } from "@test/pixelFixture"
import { readCounterLevel, readLockedProgress, readProgress } from "./cardSouls"
import { SOUL_DIGITS } from "./soulDigits"

// Positions in cells of a card 107 cells wide, as in cardSouls.
const TEXT_TOP = 122
const TENS_LEFT = 62
const UNITS_LEFT = 70
const NEEDED_LEFT = 84
const ANCHOR_LEFT = 92
const BAR_LEFT = 9
const BAR_WIDTH = 88
const BAR_TOP = 134

type Card = {
    progress: number
    needed: number
    // Pixels per cell.
    scale?: number
    showBar?: boolean
    showCounter?: boolean
    // Moves the whole text, as the game's layout sometimes does.
    shiftX?: number
    shiftY?: number
}

// Draws a card's counter and bar the way the game does, from the digit shapes
// the reader was built with.
const drawCard = ({
    progress,
    needed,
    scale = 1,
    showBar = true,
    showCounter = true,
    shiftX = 0,
    shiftY = 0,
}: Card) => {
    const rect = { x: 10, y: 10, width: 107 * scale, height: 146 * scale }
    const pixels = makePixels(
        Math.ceil(rect.width) + 20,
        Math.ceil(rect.height) + 20,
    )

    const paint = (
        cellX: number,
        cellY: number,
        width: number,
        height: number,
        color: readonly [number, number, number],
    ) => {
        fillRect(
            pixels,
            Math.round(rect.x + cellX * scale),
            Math.round(rect.y + cellY * scale),
            Math.round(width * scale),
            Math.round(height * scale),
            color,
        )
    }

    const paintDigit = (digit: number, left: number) => {
        SOUL_DIGITS[digit].forEach((row, y) => {
            for (let x = 0; x < row.length; x++) {
                const shade = parseInt(row[x], 16) * 17

                paint(left + shiftX + x, TEXT_TOP + shiftY + y, 1, 1, [
                    shade,
                    shade,
                    shade,
                ])
            }
        })
    }

    if (showCounter) {
        if (progress >= 10) {
            paintDigit(Math.floor(progress / 10), TENS_LEFT)
        }

        paintDigit(progress % 10, UNITS_LEFT)
        paintDigit(Math.floor(needed / 10), NEEDED_LEFT)
        paintDigit(needed % 10, ANCHOR_LEFT)
    }

    if (showBar) {
        paint(
            BAR_LEFT,
            BAR_TOP,
            Math.round((BAR_WIDTH * progress) / needed),
            5,
            [230, 190, 90],
        )
    }

    return { pixels: pixels, rect: rect }
}

describe("readProgress", () => {
    it.each([
        [40, 75],
        [51, 75],
        [74, 75],
        [13, 25],
        [7, 25],
        [24, 25],
    ])("reads %d/%d", (progress, needed) => {
        const { pixels, rect } = drawCard({
            progress: progress,
            needed: needed,
        })

        expect(readProgress(pixels, rect, needed)).toEqual({
            progress: progress,
            unsure: false,
        })
    })

    it("reads a value too small for the bar to show past the badge", () => {
        const { pixels, rect } = drawCard({ progress: 2, needed: 25 })

        expect(readProgress(pixels, rect, 25).progress).toBe(2)
    })

    it("reads two digits with the bar hidden, at /75", () => {
        const { pixels, rect } = drawCard({
            progress: 11,
            needed: 75,
            showBar: false,
        })

        expect(readProgress(pixels, rect, 75).progress).toBe(11)
    })

    it("reads two digits with the bar hidden, at /25", () => {
        const { pixels, rect } = drawCard({
            progress: 13,
            needed: 25,
            showBar: false,
        })

        expect(readProgress(pixels, rect, 25).progress).toBe(13)
    })

    it("finds text shifted a little", () => {
        const { pixels, rect } = drawCard({
            progress: 40,
            needed: 75,
            shiftX: 1,
            shiftY: -2,
        })

        expect(readProgress(pixels, rect, 75).progress).toBe(40)
    })

    it("reads a bigger card", () => {
        const { pixels, rect } = drawCard({
            progress: 40,
            needed: 75,
            scale: 2,
        })

        expect(readProgress(pixels, rect, 75)).toEqual({
            progress: 40,
            unsure: false,
        })
    })

    it("falls back on the bar, unsure, without a readable counter", () => {
        const { pixels, rect } = drawCard({
            progress: 40,
            needed: 75,
            showCounter: false,
        })
        const reading = readProgress(pixels, rect, 75)

        expect(reading.unsure).toBe(true)
        expect(reading.progress).toBeGreaterThanOrEqual(39)
        expect(reading.progress).toBeLessThanOrEqual(41)
    })

    it("is unsure on a card too small for digits", () => {
        const { pixels, rect } = drawCard({
            progress: 40,
            needed: 75,
            scale: 0.7,
        })

        expect(readProgress(pixels, rect, 75).unsure).toBe(true)
    })

    it("never reads as high as the next level", () => {
        const { pixels, rect } = drawCard({ progress: 74, needed: 75 })

        expect(readProgress(pixels, rect, 75).progress).toBeLessThan(75)
    })
})

describe("readCounterLevel", () => {
    it("reads /25 as Lv1 and /75 as Lv2, over the badge", () => {
        const low = drawCard({ progress: 13, needed: 25 })
        const high = drawCard({ progress: 40, needed: 75 })

        expect(readCounterLevel(low.pixels, low.rect, 2)).toBe(1)
        expect(readCounterLevel(high.pixels, high.rect, 1)).toBe(2)
    })

    it("keeps the badge's answer without a readable counter", () => {
        const { pixels, rect } = drawCard({
            progress: 13,
            needed: 25,
            showCounter: false,
        })

        expect(readCounterLevel(pixels, rect, 2)).toBe(2)
    })
})

describe("readLockedProgress", () => {
    it("reads the bar alone", () => {
        const { pixels, rect } = drawCard({
            progress: 3,
            needed: 5,
            showCounter: false,
        })

        expect(readLockedProgress(pixels, rect, 5)).toEqual({
            progress: 3,
            unsure: false,
        })
    })

    it("is 0 with an empty bar", () => {
        const { pixels, rect } = drawCard({
            progress: 0,
            needed: 5,
            showBar: false,
            showCounter: false,
        })

        expect(readLockedProgress(pixels, rect, 5).progress).toBe(0)
    })

    it("stays below a full level", () => {
        const { pixels, rect } = drawCard({
            progress: 5,
            needed: 5,
            showCounter: false,
        })

        expect(readLockedProgress(pixels, rect, 5).progress).toBe(4)
    })
})
