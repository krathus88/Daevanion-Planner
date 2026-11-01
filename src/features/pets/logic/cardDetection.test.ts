import { describe, expect, it } from "vitest"
import { fillRect, makePixels, toRgb } from "@test/pixelFixture"
import { CARD_RATIO, detectCards } from "./cardDetection"

const WIDTH = 60
const HEIGHT = Math.round(WIDTH * CARD_RATIO)
const GAP = 8
const CARD = [120, 110, 100] as const

// Rows and columns of cards from (20, 20), on the game's near-black background.
// The picture is cropped to the grid's height: a column counts as a gap when
// most of it is dark, so cards have to fill the height, as they do in the game.
const drawGrid = (columns: number, rows: number) => {
    const pixels = makePixels(800, 40 + rows * (HEIGHT + GAP))

    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            fillRect(
                pixels,
                20 + column * (WIDTH + GAP),
                20 + row * (HEIGHT + GAP),
                WIDTH,
                HEIGHT,
                CARD,
            )
        }
    }

    return pixels
}

describe("detectCards", () => {
    it("finds a grid of cards in reading order", () => {
        const cards = detectCards(drawGrid(3, 2))

        expect(cards).toHaveLength(6)
        expect(cards[0]).toEqual({
            x: 20,
            y: 20,
            width: WIDTH,
            height: HEIGHT,
        })
        expect(cards[1].x).toBe(20 + WIDTH + GAP)
        expect(cards[3].y).toBe(20 + HEIGHT + GAP)
        expect(cards[3].x).toBe(20)
    })

    it("reads 3-channel pixels too", () => {
        expect(detectCards(toRgb(drawGrid(3, 2)))).toHaveLength(6)
    })

    it("finds nothing on an empty screen", () => {
        expect(detectCards(makePixels(800, 600))).toEqual([])
    })

    it("needs neighbors: a lone card could be anything", () => {
        expect(detectCards(drawGrid(1, 2))).toEqual([])
    })

    it("ignores a big render beside the grid", () => {
        const pixels = drawGrid(3, 2)

        fillRect(pixels, 400, 20, 300, 160, [200, 200, 200])

        expect(detectCards(pixels)).toHaveLength(6)
    })

    it("skips a card cut off by the screenshot's edge", () => {
        const pixels = makePixels(800, 20 + HEIGHT + GAP + 30)

        for (const x of [20, 20 + WIDTH + GAP]) {
            fillRect(pixels, x, 20, WIDTH, HEIGHT, CARD)
            fillRect(pixels, x, 20 + HEIGHT + GAP, WIDTH, 30, CARD)
        }

        const cards = detectCards(pixels)

        expect(cards).toHaveLength(2)
        expect(cards[0].y).toBe(20)
    })

    it("lines a glowing selected card up with its row", () => {
        const pixels = drawGrid(3, 1)

        // The selected card's glow starts two rows early.
        fillRect(pixels, 20 + WIDTH + GAP, 18, WIDTH, 2, CARD)

        const tops = detectCards(pixels).map((card) => card.y)

        expect(tops).toEqual([20, 20, 20])
    })

    it("keeps a column a selected card's glow widens", () => {
        const pixels = drawGrid(3, 2)

        // The glow runs past both sides of the first card, on half the height.
        fillRect(pixels, 17, 14, WIDTH + 6, HEIGHT + 12, CARD)

        const cards = detectCards(pixels)

        expect(cards).toHaveLength(6)
        expect(cards[0]).toMatchObject({ x: 20, width: WIDTH })
    })

    it("still leaves out something much wider than the cards", () => {
        const pixels = drawGrid(3, 2)

        fillRect(pixels, 300, 20, WIDTH * 2, 160, CARD)

        expect(detectCards(pixels)).toHaveLength(6)
    })

    it("allows a badge hanging below a card", () => {
        const pixels = drawGrid(3, 1)

        fillRect(pixels, 20, 20 + HEIGHT, WIDTH, 6, CARD)

        expect(detectCards(pixels)).toHaveLength(3)
    })
})
