import { describe, expect, it } from "vitest"
import {
    INGOT,
    makeCraftingData,
    makeSettings,
    ORE,
    SOLVENT,
    SWORD,
} from "@test/craftingFixture"
import type { ComboValue } from "./comboValue"
import { buildCraftPlan } from "./craftPlan"
import {
    getCraftItRows,
    getExpectedRows,
    getProfitRows,
    getToBuyRows,
} from "./kinahBreakdown"

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
    netCostPerProc: 230,
    profitPerAttempt: 77.5,
}

describe("getProfitRows", () => {
    it("takes the tax and the expected cost off the sale", () => {
        expect(getProfitRows(200, 125)).toEqual([
            { label: "Sells for", value: 200, total: false },
            { label: "Market tax (10%)", value: -20, total: false },
            { label: "You get", value: 180, total: true },
            { label: "Expected cost", value: -125, total: false },
            { label: "Profit", value: 55, total: true },
        ])
    })
})

describe("getCraftItRows", () => {
    it("adds up the crafts, less the regular items sold", () => {
        expect(getCraftItRows(VALUE)).toEqual([
            { label: "4 crafts × 125 Kinah", value: 500, total: false },
            {
                label: "About 3 regular sold, after tax",
                value: -270,
                total: false,
            },
            { label: "Craft it", value: 230, total: true },
        ])
    })

    it("leaves the sale out while the regular item has no price", () => {
        expect(getCraftItRows({ ...VALUE, netCostPerProc: null })).toEqual([
            { label: "4 crafts × 125 Kinah", value: 500, total: false },
            { label: "Craft it", value: 500, total: true },
        ])
    })

    it("is empty while a material has no price", () => {
        expect(
            getCraftItRows({ ...VALUE, attemptCost: null, costPerProc: null }),
        ).toEqual([])
    })
})

describe("getToBuyRows", () => {
    const data = makeCraftingData()

    it("lists the priced missing materials and their total", () => {
        const plan = buildCraftPlan(
            data,
            makeSettings({
                prices: { [ORE]: 10, [SOLVENT]: 5 },
                owned: { [ORE]: 10 },
            }),
            SWORD,
            1,
        )

        // 25 Ore needed (20 for the Ingots, 5 for the Sword), 10 in the bag.
        expect(getToBuyRows(plan)).toEqual([
            { label: "15× Ore", value: 150, total: false },
            { label: "10× Solvent", value: 50, total: false },
            { label: "To buy", value: 200, total: true },
        ])
    })

    it("is empty when the bag has it all", () => {
        const plan = buildCraftPlan(
            data,
            makeSettings({ owned: { [INGOT]: 3, [ORE]: 5 } }),
            SWORD,
            1,
        )

        expect(getToBuyRows(plan)).toEqual([])
    })
})

describe("getExpectedRows", () => {
    it("multiplies one craft's cost by the crafts it takes on average", () => {
        expect(getExpectedRows(100, 1.5, 2)).toEqual([
            { label: "Per craft", value: 100, total: false },
            {
                label: "Expected for 2 (3 crafts on average)",
                value: 300,
                total: true,
            },
        ])
    })

    it("keeps two decimals of the crafts on average", () => {
        expect(getExpectedRows(100, 1 / 0.9426, 1)[1].label).toBe(
            "Expected for 1 (1.06 crafts on average)",
        )
    })
})
