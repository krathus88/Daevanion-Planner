import { describe, expect, it } from "vitest"
import { makeCraftingData, makeSettings, ORE } from "@test/craftingFixture"
import { getComboValue } from "./comboValue"
import { buildCraftPlan } from "./craftPlan"
import { getTreeLines, indexPlan } from "./craftTree"
import { isTradable } from "./tradable"

// A White Sword is Transfer Crafting from a Sword; a Splendent White Sword
// (Transfer Crafting too) procs from it.
const SWORD = 10
const WHITE = 20
const SPLENDENT_WHITE = 21
const data = makeCraftingData(
    [
        { id: SWORD, mastery: 1, materials: [[ORE, 2]] },
        { id: WHITE, transfer: true, materials: [[SWORD, 1]] },
        {
            id: SPLENDENT_WHITE,
            transfer: true,
            materials: [[SWORD, 1]],
            combo: { base: WHITE, chance: 25, only: false },
        },
    ],
    [
        [ORE, "Ore", "common"],
        [SWORD, "Sword", "common"],
        [WHITE, "White Sword", "rare"],
        [SPLENDENT_WHITE, "Splendent White Sword", "epic"],
    ],
)
const white = data.recipes.get(WHITE)

describe("isTradable", () => {
    it("leaves Transfer Crafting items off the market", () => {
        expect(isTradable(data, SWORD)).toBe(true)
        expect(isTradable(data, ORE)).toBe(true)
        expect(isTradable(data, WHITE)).toBe(false)
    })

    it("always crafts them, even when marked bought", () => {
        const recipes = makeCraftingData(
            [
                { id: SWORD, materials: [[WHITE, 1]] },
                { id: WHITE, transfer: true, materials: [[ORE, 1]] },
            ],
            [
                [ORE, "Ore", "common"],
                [SWORD, "Sword", "common"],
                [WHITE, "White Sword", "rare"],
            ],
        )
        const settings = makeSettings({ bought: [WHITE] })
        const plan = buildCraftPlan(recipes, settings, SWORD, 1)
        const sword = recipes.recipes.get(SWORD)

        expect(plan.steps.map((step) => step.item.id)).toEqual([SWORD, WHITE])

        if (!sword) {
            throw new Error("The test has a Sword recipe.")
        }

        expect(
            getTreeLines(recipes, settings, indexPlan(plan), sword)[0],
        ).toMatchObject({ tradable: false })
    })

    it("gives the combo no market prices", () => {
        if (!white) {
            throw new Error("The test has a White Sword recipe.")
        }

        const value = getComboValue(
            data,
            makeSettings({ prices: { [WHITE]: 100, [SPLENDENT_WHITE]: 900 } }),
            white,
            SPLENDENT_WHITE,
            25,
        )

        expect(value).toMatchObject({
            regularTradable: false,
            splendentTradable: false,
            regularPrice: null,
            splendentPrice: null,
            profitPerAttempt: null,
        })
    })
})
