import { describe, expect, it } from "vitest"
import { dealCards } from "./cardColumns"

describe("dealCards", () => {
    it("deals cards of one weight left to right", () => {
        expect(dealCards([1, 1, 1, 1, 1], 3)).toEqual([[0, 3], [1, 4], [2]])
    })

    it("puts the next card under the lightest column", () => {
        expect(dealCards([3, 1, 3, 1], 3)).toEqual([[0], [1, 3], [2]])
    })

    it("takes the leftmost column on a tie", () => {
        expect(dealCards([1, 3, 1, 1], 3)).toEqual([[0, 3], [1], [2]])
    })

    it("keeps everything in one column", () => {
        expect(dealCards([3, 1, 3], 1)).toEqual([[0, 1, 2]])
    })

    it("leaves extra columns empty", () => {
        expect(dealCards([1], 3)).toEqual([[0], [], []])
    })
})
