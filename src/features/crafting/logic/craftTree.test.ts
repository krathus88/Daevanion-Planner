import { describe, expect, it } from "vitest"
import {
    INGOT,
    makeCraftingData,
    makeSettings,
    ORE,
    SOLVENT,
    SWORD,
} from "@test/craftingFixture"
import { buildCraftPlan } from "./craftPlan"
import { getTreeLines, indexPlan } from "./craftTree"

const data = makeCraftingData()
const PRICES = { [ORE]: 10, [SOLVENT]: 5 }

const getLines = (settings = makeSettings(), id = SWORD) => {
    const plan = buildCraftPlan(data, settings, SWORD, 2)
    const recipe = data.recipes.get(id)

    if (!recipe) {
        throw new Error("The fixture has this recipe.")
    }

    return getTreeLines(data, settings, indexPlan(plan), recipe)
}

describe("getTreeLines", () => {
    it("lists what one craft uses, with the plan's totals", () => {
        const lines = getLines(makeSettings({ prices: PRICES }))

        // A Sword takes 3 Ingots and 5 Ore; 2 Swords need 6 and 30 (with
        // the Ingots' 20).
        expect(
            lines.map((line) => {
                return {
                    id: line.item.id,
                    perCraft: line.perCraft,
                    planNeed: line.planNeed,
                    price: line.price,
                    craftCost: line.craftCost,
                    crafted: line.step !== null,
                }
            }),
        ).toEqual([
            {
                id: INGOT,
                perCraft: 3,
                planNeed: 6,
                price: null,
                craftCost: 25,
                crafted: true,
            },
            {
                id: ORE,
                perCraft: 5,
                planNeed: 30,
                price: 10,
                craftCost: null,
                crafted: false,
            },
        ])
    })

    it("opens a crafted line into its own recipe", () => {
        const lines = getLines(makeSettings(), INGOT)

        expect(lines.map((line) => line.item.id)).toEqual([ORE, SOLVENT])
        expect(lines[0]).toMatchObject({ price: null, craftCost: null })
    })

    it("marks what the bag covers", () => {
        const lines = getLines(makeSettings({ owned: { [INGOT]: 6 } }))

        expect(lines[0].covered).toBe(true)
        expect(lines[1].covered).toBe(false)
    })

    it("treats an item bought instead as a material", () => {
        const lines = getLines(makeSettings({ bought: [INGOT] }))

        expect(lines[0]).toMatchObject({ step: null, planNeed: 6 })
    })
})
