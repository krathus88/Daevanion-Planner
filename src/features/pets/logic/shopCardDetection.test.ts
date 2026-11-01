import { describe, expect, it } from "vitest"
import { fillRect, makePixels } from "@test/pixelFixture"
import { detectShopCards } from "./shopCardDetection"

const LINE = [210, 210, 210] as const
const WIDTH = 120
const SIDE = 160

type Frame = {
    x: number
    y: number
    hideTop?: boolean
}

// A card's frame: two thin side lines joined by a top edge.
const drawFrames = (frames: Frame[]) => {
    const pixels = makePixels(900, 600, [30, 30, 30])

    for (const frame of frames) {
        fillRect(pixels, frame.x, frame.y, 2, SIDE, LINE)
        fillRect(pixels, frame.x + WIDTH, frame.y, 2, SIDE, LINE)

        if (!frame.hideTop) {
            fillRect(pixels, frame.x, frame.y, WIDTH + 2, 2, LINE)
        }
    }

    return pixels
}

// Cards hang at uneven heights in the game. A side line starts just below the
// top edge, so a card's y is 2 px under the frame's.
describe("detectShopCards", () => {
    it("finds frames, left to right", () => {
        const cards = detectShopCards(
            drawFrames([
                { x: 340, y: 50 },
                { x: 40, y: 50 },
                { x: 190, y: 80 },
            ]),
        )

        expect(cards.map((card) => card.x)).toEqual([41, 191, 341])

        for (const card of cards) {
            expect(card.width).toBe(WIDTH)
            expect(card.height).toBe(WIDTH)
        }

        expect(cards[0].y).toBe(52)
        expect(cards[1].y).toBe(82)
    })

    it("keeps uneven cards in one row, then starts the next", () => {
        const cards = detectShopCards(
            drawFrames([
                { x: 190, y: 40 },
                { x: 40, y: 70 },
                { x: 40, y: 300 },
            ]),
        )

        expect(cards.map((card) => card.x)).toEqual([41, 191, 41])
        expect(cards[2].y).toBe(302)
    })

    it("needs the top edge: two lines alone aren't a card", () => {
        expect(
            detectShopCards(drawFrames([{ x: 40, y: 50, hideTop: true }])),
        ).toEqual([])
    })

    it("ignores odd-sized boxes among the cards", () => {
        const pixels = drawFrames([
            { x: 40, y: 50 },
            { x: 190, y: 80 },
            { x: 340, y: 50 },
        ])

        // A tall thin box: too narrow for its height to be a frame.
        fillRect(pixels, 600, 50, 2, 300, LINE)
        fillRect(pixels, 640, 50, 2, 300, LINE)
        fillRect(pixels, 600, 50, 42, 2, LINE)

        expect(detectShopCards(pixels)).toHaveLength(3)
    })

    it("finds nothing on an empty screen", () => {
        expect(detectShopCards(makePixels(400, 300, [30, 30, 30]))).toEqual([])
    })

    it("joins a side broken by a tag", () => {
        const pixels = drawFrames([{ x: 40, y: 50 }])

        fillRect(pixels, 40, 120, 2, 8, [30, 30, 30])

        expect(detectShopCards(pixels)).toHaveLength(1)
    })
})
