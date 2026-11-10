import { describe, expect, it } from "vitest"
import { describeComboHint } from "./comboLabels"
import type { ComboValue } from "./comboValue"
import { partsToText } from "./textParts"

const RING = { id: 1, name: "Ring", grade: "rare" as const }

// The hint as plain text.
const getHint = (value: ComboValue) => {
    const hint = describeComboHint(value, RING)

    return hint === null ? null : partsToText(hint)
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

describe("describeComboHint", () => {
    it("says nothing once every price is in", () => {
        expect(getHint(VALUE)).toBeNull()
    })

    it("asks for the materials' prices first", () => {
        expect(
            getHint({ ...VALUE, attemptCost: null, costPerProc: null }),
        ).toBe("Price every material to see what a proc costs.")
    })

    it("asks for the regular item's and then its own price", () => {
        expect(getHint({ ...VALUE, netCostPerProc: null })).toBe(
            "Set what Ring sells for (Main craft) to count the ones made on the way.",
        )
        expect(getHint({ ...VALUE, splendentPrice: null })).toBe(
            "Set its price to compare with buying one.",
        )
    })

    it("asks nothing of bound items", () => {
        expect(
            getHint({
                ...VALUE,
                regularTradable: false,
                splendentTradable: false,
                regularPrice: null,
                splendentPrice: null,
                netCostPerProc: null,
                profitPerAttempt: null,
            }),
        ).toBeNull()
    })
})
