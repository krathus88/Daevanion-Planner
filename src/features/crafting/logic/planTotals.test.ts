import { describe, expect, it } from "vitest"
import {
    makeCraftingData,
    makeSettings,
    ORE,
    SOLVENT,
    SWORD,
} from "@test/craftingFixture"
import { buildCraftPlan } from "./craftPlan"
import { getPlanTotals } from "./planTotals"

const data = makeCraftingData()

describe("getPlanTotals", () => {
    it("reads an unpriced plan's Kinah as unknown, not free", () => {
        const plan = buildCraftPlan(data, makeSettings(), SWORD, 2)

        expect(getPlanTotals(plan)).toEqual({
            spend: null,
            missing: 2,
            unpriced: 2,
        })
    })

    it("counts bag materials as still needing a price", () => {
        const plan = buildCraftPlan(
            data,
            makeSettings({ owned: { [SOLVENT]: 50 }, prices: { [ORE]: 10 } }),
            SWORD,
            2,
        )

        expect(getPlanTotals(plan)).toEqual({
            spend: 300,
            missing: 1,
            unpriced: 1,
        })
    })
})
