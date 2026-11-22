import { dealCards } from "@common/cardColumns"
import { describe, expect, it } from "vitest"
import {
    getCardWeight,
    LINE_WEIGHT,
    MINIMIZED_WEIGHT,
    OPEN_WEIGHT,
} from "./cardWeights"

describe("getCardWeight", () => {
    it("weighs an open card more than any minimized one", () => {
        const open = getCardWeight({
            minimized: false,
            hasNote: false,
            hasPending: true,
        })
        const fullest = getCardWeight({
            minimized: true,
            hasNote: true,
            hasPending: true,
        })

        expect(open).toBe(OPEN_WEIGHT)
        expect(fullest).toBeLessThan(open)
    })

    it("adds a line for the note, open or minimized", () => {
        expect(
            getCardWeight({
                minimized: false,
                hasNote: true,
                hasPending: false,
            }),
        ).toBe(OPEN_WEIGHT + LINE_WEIGHT)
        expect(
            getCardWeight({
                minimized: true,
                hasNote: true,
                hasPending: false,
            }),
        ).toBe(MINIMIZED_WEIGHT + LINE_WEIGHT)
    })

    it("adds the Left line only to a minimized card", () => {
        expect(
            getCardWeight({
                minimized: true,
                hasNote: false,
                hasPending: true,
            }),
        ).toBe(MINIMIZED_WEIGHT + LINE_WEIGHT)
        expect(
            getCardWeight({
                minimized: false,
                hasNote: false,
                hasPending: true,
            }),
        ).toBe(OPEN_WEIGHT)
    })

    it("puts the fourth card under a card without a Left line", () => {
        const minimized = (hasPending: boolean) =>
            getCardWeight({ minimized: true, hasNote: true, hasPending })

        // The first card still has tasks left, the next two are done.
        const weights = [true, false, false, true].map(minimized)

        expect(dealCards(weights, 3)).toEqual([[0], [1, 3], [2]])

        // Once the first card is done too, the fourth goes back under it.
        const allDone = [false, false, false, true].map(minimized)

        expect(dealCards(allDone, 3)).toEqual([[0, 3], [1], [2]])
    })
})
