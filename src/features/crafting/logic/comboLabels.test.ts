import { describe, expect, it } from "vitest"
import {
    describeComboChance,
    describeComboHint,
    describeComboVerdict,
} from "./comboLabels"
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
    success: 100,
    successKnown: true,
    attemptsPerProc: 4,
    regularsPerProc: 3,
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
            "Set what Ring sells for (beside the profit above) to count the ones made on the way.",
        )
        expect(getHint({ ...VALUE, splendentPrice: null })).toBe(
            "No market price for it: set its price under Buy it.",
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

describe("describeComboChance", () => {
    it("says a craft's chance and how it's made up", () => {
        expect(
            describeComboChance(
                {
                    ...VALUE,
                    procChance: 0.218,
                    success: 87.2,
                    attemptsPerProc: 1 / 0.218,
                },
                25,
            ),
        ).toBe("Each craft: 21.8% chance (25% × 87.2% success), about 1 in 4.6")
    })

    it("leaves out a sure success", () => {
        expect(describeComboChance(VALUE, 25)).toBe(
            "Each craft: 25% chance, about 1 in 4",
        )
    })

    it("says when success is taken as 100%", () => {
        expect(describeComboChance({ ...VALUE, successKnown: false }, 25)).toBe(
            "Each craft: 25% chance at 100% success, about 1 in 4",
        )
    })
})

describe("describeComboVerdict", () => {
    it("says which way is cheaper, and by how much", () => {
        expect(describeComboVerdict(200, 600)).toEqual({
            text: "Crafting is 400 Kinah cheaper",
            cheaperToCraft: true,
        })
        expect(describeComboVerdict(700, 600)).toEqual({
            text: "Buying is 100 Kinah cheaper",
            cheaperToCraft: false,
        })
    })

    it("is null while a side is unknown", () => {
        expect(describeComboVerdict(null, 600)).toBeNull()
        expect(describeComboVerdict(200, null)).toBeNull()
    })
})
