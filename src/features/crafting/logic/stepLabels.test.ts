import { describe, expect, it } from "vitest"
import {
    INGOT,
    makeCraftingData,
    makeSettings,
    ORE,
    SPLENDENT_SWORD,
    SWORD,
} from "@test/craftingFixture"
import { buildCraftPlan } from "./craftPlan"
import {
    describeCombo,
    describeCrafts,
    describeMorph,
    describeNeed,
} from "./stepLabels"
import { partsToText } from "./textParts"

const data = makeCraftingData()

// The combo line as plain text, null when there's none.
const getComboText = (...args: Parameters<typeof describeCombo>) => {
    const parts = describeCombo(...args)

    return parts === null ? null : partsToText(parts)
}
// A Cooking recipe: 1 per craft, 30% of the time 2.
const STEW = 900
const cooking = makeCraftingData(
    [{ id: STEW, profession: "cooking", materials: [[ORE, 2]] }],
    [
        [ORE, "Ore", "common"],
        [STEW, "Stew", "common"],
    ],
)

describe("describeNeed and describeCrafts", () => {
    it("say what's needed, in the bag and crafted", () => {
        const plan = buildCraftPlan(
            data,
            makeSettings({ owned: { [INGOT]: 2 }, success: { [SWORD]: 50 } }),
            SWORD,
            3,
        )

        expect(describeNeed(plan.steps[0], true)).toBe("3 to make")
        expect(describeCrafts(plan.steps[0])).toBe(
            "3 crafts · about 6 attempts",
        )
        expect(describeNeed(plan.steps[1], false)).toBe(
            "18 needed · 2 in the bag",
        )
        expect(describeCrafts(plan.steps[1])).toBe("2 crafts of 10")
    })

    it("mentions Cooking's double chance", () => {
        const plan = buildCraftPlan(cooking, makeSettings(), STEW, 13)

        expect(describeCrafts(plan.steps[0])).toBe("10 crafts, 30% make double")
    })
})

describe("describeCombo", () => {
    it("explains a combo item and what's made on the way", () => {
        const plan = buildCraftPlan(data, makeSettings(), SPLENDENT_SWORD, 1)

        expect(getComboText(data, plan.steps[0])).toBe(
            "Not crafted directly: procs 25% of the time when crafting Sword, using these materials. About 3 Sword made on the way.",
        )
        expect(getComboText(data, plan.steps[1])).toBeNull()
    })

    it("says what the misses make instead", () => {
        const chain = makeCraftingData(
            [
                { id: 5, category: "mace", materials: [[1, 1]] },
                { id: 11, category: "mace", materials: [[5, 1]] },
                {
                    id: 21,
                    category: "mace",
                    materials: [[5, 1]],
                    combo: { base: 11, chance: 25, only: true },
                },
            ],
            [
                [1, "Ore", "common"],
                [5, "Splendent Mace", "rare"],
                [11, "Expert's Mace", "rare"],
                [21, "Expert's Splendent Mace", "epic"],
            ],
        )
        const plan = buildCraftPlan(chain, makeSettings(), 21, 1)

        expect(getComboText(chain, plan.steps[0])).toBe(
            "Not crafted directly: procs 25% of the time when crafting Expert's Mace, using these materials. About 3 Expert's Mace made on the way.",
        )
    })

    it("says a transfer's combo can skip it", () => {
        const transfer = makeCraftingData(
            [
                { id: 41, transfer: true, materials: [[1, 1]] },
                {
                    id: 42,
                    transfer: true,
                    materials: [[41, 1]],
                    combo: { base: 41, chance: 25, only: false },
                },
            ],
            [
                [1, "Ore", "common"],
                [41, "White Greatsword", "unique"],
                [42, "Splendent White Greatsword", "unique"],
            ],
        )
        const one = buildCraftPlan(transfer, makeSettings(), 42, 1)
        const four = buildCraftPlan(transfer, makeSettings(), 42, 4)

        expect(getComboText(transfer, one.steps[0])).toBe(
            "Crafting White Greatsword makes this directly 25% of the time, skipping this transfer.",
        )
        expect(describeCrafts(four.steps[0])).toBe(
            "4 crafts · about 3 transfers, 1 by combo",
        )
        expect(getComboText(transfer, four.steps[0])).toBe(
            "Crafting White Greatsword makes this directly 25% of the time, skipping this transfer: about 1 of 4 come that way, so only the rest need this recipe.",
        )
    })

    it("says what the combo chance of the item crafted makes", () => {
        const many = buildCraftPlan(data, makeSettings(), SWORD, 8)
        const one = buildCraftPlan(data, makeSettings(), SWORD, 1)

        expect(getComboText(data, many.steps[0])).toBe(
            "Combo Activation Chance 25%: about 2 of these crafts make Splendent Sword.",
        )
        expect(getComboText(data, one.steps[0])).toBe(
            "Combo Activation Chance 25%: a craft can make Splendent Sword.",
        )
    })
})

describe("describeMorph", () => {
    it("says the material is counted at the Odyle's price", () => {
        expect(describeMorph("Fine Odyle", 4998)).toBe(
            "Cheaper from Fine Odyle by Substance Morph (1 for 1): counted at 4,998 Kinah each.",
        )
    })
})
