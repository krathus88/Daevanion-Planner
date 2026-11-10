import { describe, expect, it } from "vitest"
import { describeComboVerdict } from "./comboLabels"
import type { ComboValue } from "./comboValue"
import { partsToText } from "./textParts"

const RING = { id: 1, name: "Ring", grade: "rare" as const }
const SPLENDENT_RING = { id: 2, name: "Splendent Ring", grade: "epic" as const }
const WHITE = { id: 3, name: "White Sword", grade: "unique" as const }
const SPLENDENT_WHITE = {
    id: 4,
    name: "Splendent White Sword",
    grade: "unique" as const,
}

// The lines as plain text.
const getLines = (...args: Parameters<typeof describeComboVerdict>) => {
    return describeComboVerdict(...args).map(partsToText)
}

const VALUE: ComboValue = {
    procChance: 0.25,
    regularChance: 0.75,
    successKnown: true,
    attemptsPerProc: 4,
    craftsFor: [],
    attemptCost: 125,
    regularPrice: 100,
    splendentPrice: 600,
    regularTradable: true,
    splendentTradable: true,
    costPerProc: 500,
    netCostPerProc: 200,
    profitPerAttempt: 100,
}

describe("describeComboVerdict", () => {
    it("says which is cheaper and what crafting to sell makes", () => {
        expect(getLines(VALUE, RING, SPLENDENT_RING)).toEqual([
            "About 4 attempts at 125 Kinah: 500 Kinah per Splendent Ring, 200 Kinah once the Ring made on the way are sold (after 10% tax).",
            "Crafting for it is cheaper than buying one by 400 Kinah.",
            "Crafting 100 to sell everything made: about 10,000 Kinah profit after 10% tax.",
        ])
    })

    it("asks for prices first", () => {
        expect(
            getLines(
                { ...VALUE, attemptCost: null, costPerProc: null },
                RING,
                SPLENDENT_RING,
            ),
        ).toEqual(["Price every material to see what a proc costs."])
    })

    it("leaves the market out for bound items", () => {
        expect(
            getLines(
                {
                    ...VALUE,
                    regularTradable: false,
                    splendentTradable: false,
                    regularPrice: null,
                    splendentPrice: null,
                    netCostPerProc: null,
                    profitPerAttempt: null,
                },
                WHITE,
                SPLENDENT_WHITE,
            ),
        ).toEqual([
            "About 4 attempts at 125 Kinah: 500 Kinah per Splendent White Sword.",
            "Splendent White Sword is bound.",
        ])
    })
})
