import { describe, expect, it } from "vitest"
import {
    makeCraftingData,
    makeSettings,
    ORE,
    SOLVENT,
    SPLENDENT_SWORD,
    SWORD,
} from "@test/craftingFixture"
import { getComboValue, getProcOdds } from "./comboValue"

const data = makeCraftingData()
const sword = data.recipes.get(SWORD) ?? null
// A Sword's materials cost 125 Kinah: 3 Ingots at 25 and 5 Ore at 10.
const PRICES = { [ORE]: 10, [SOLVENT]: 5 }

const getValue = (settings = makeSettings()) => {
    if (!sword) {
        throw new Error("The fixture has a Sword recipe.")
    }

    return getComboValue(data, settings, sword, SPLENDENT_SWORD, 25)
}

describe("getComboValue", () => {
    it("gives the odds of a proc", () => {
        const value = getValue()

        expect(value).toMatchObject({
            procChance: 0.25,
            regularChance: 0.75,
            successKnown: false,
            attemptsPerProc: 4,
        })
        expect(value?.craftsFor).toEqual([
            { confidence: 50, crafts: 3 },
            { confidence: 75, crafts: 5 },
            { confidence: 90, crafts: 9 },
            { confidence: 95, crafts: 11 },
        ])
    })

    it("compares a proc's cost with what the regular items sell for", () => {
        const value = getValue(
            makeSettings({
                prices: { ...PRICES, [SWORD]: 100, [SPLENDENT_SWORD]: 600 },
            }),
        )

        expect(value).toMatchObject({
            attemptCost: 125,
            costPerProc: 500,
            // 4 attempts for 500, less 3 Swords sold at 100 less 10% tax.
            netCostPerProc: 230,
            // 25% x 540 + 75% x 90 - 125, sales after the 10% tax.
            profitPerAttempt: 77.5,
        })
    })

    it("counts failed crafts in the cost", () => {
        const value = getValue(
            makeSettings({ prices: PRICES, success: { [SWORD]: 50 } }),
        )

        expect(value).toMatchObject({
            procChance: 0.125,
            successKnown: true,
            attemptCost: 125,
            costPerProc: 1000,
            netCostPerProc: null,
            profitPerAttempt: null,
        })
    })

    it("leaves the Kinah out until every material has a price", () => {
        expect(getValue()).toMatchObject({
            attemptCost: null,
            costPerProc: null,
        })
    })
})

describe("getProcOdds", () => {
    it("gives the chance of at least one proc", () => {
        expect(getProcOdds(0.25, 4)).toBeCloseTo(0.684, 3)
    })
})
