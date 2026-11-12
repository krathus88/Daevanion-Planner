import { describe, expect, it } from "vitest"
import type { PetCollection } from "@pets/storage/petCollection"
import { applyToPets } from "./applyToPets"

const COLLECTION: PetCollection = {
    levels: { "9": 1 },
    souls: { "9": 10 },
    hiddenLevels: [3],
    minimized: true,
    listMinimized: false,
    tipDismissed: true,
}

const CHARACTER = { name: "Testchar", server: 1301, class: 30 }

describe("applyToPets", () => {
    it("turns the game's level progress into total souls", () => {
        const next = applyToPets(COLLECTION, {
            character: CHARACTER,
            pets: {
                "1192": [2, 49],
                "1005": [3, 0],
                "1100": [0, 3],
                "1200": [0, 0],
            },
        })

        expect(next.levels).toEqual({ "1192": 2, "1005": 3 })
        expect(next.souls).toEqual({ "1192": 79, "1005": 105, "1100": 3 })
    })

    it("replaces the list and keeps the page settings", () => {
        const next = applyToPets(COLLECTION, {
            character: CHARACTER,
            pets: {},
        })

        expect(next).toEqual({ ...COLLECTION, levels: {}, souls: {} })
    })

    it("changes nothing without a pet list", () => {
        expect(applyToPets(COLLECTION, { character: CHARACTER })).toBe(
            COLLECTION,
        )
    })
})
