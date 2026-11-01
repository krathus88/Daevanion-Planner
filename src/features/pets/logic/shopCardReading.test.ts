import { describe, expect, it } from "vitest"
import { fillRect, makePixels } from "@test/pixelFixture"
import { isSoldOut } from "./shopCardReading"

const rect = { x: 0, y: 0, width: 200, height: 200 }
const RED = [220, 30, 30] as const

const card = (background: readonly [number, number, number]) => {
    return makePixels(200, 240, background)
}

describe("isSoldOut", () => {
    it("sees red text on a dark band", () => {
        const pixels = card([20, 20, 20])

        fillRect(pixels, 60, 172, 80, 4, RED)

        expect(isSoldOut(pixels, rect)).toBe(true)
    })

    it("ignores a card with no red", () => {
        expect(isSoldOut(card([20, 20, 20]), rect)).toBe(false)
    })

    it("ignores bright art with red in it", () => {
        const pixels = card([200, 180, 120])

        fillRect(pixels, 60, 170, 80, 10, RED)

        expect(isSoldOut(pixels, rect)).toBe(false)
    })

    it("ignores a big red shape on a dark card", () => {
        const pixels = card([20, 20, 20])

        fillRect(pixels, 50, 160, 100, 36, RED)

        expect(isSoldOut(pixels, rect)).toBe(false)
    })

    it("copes with a card past the screenshot's edge", () => {
        expect(isSoldOut(makePixels(100, 100), { ...rect, y: 200 })).toBe(false)
    })
})
