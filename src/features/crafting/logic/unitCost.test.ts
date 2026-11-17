import { describe, expect, it } from "vitest"
import {
    GREAT_SWORD,
    INGOT,
    makeCraftingData,
    makeSettings,
    ORE,
    SOLVENT,
    SPLENDENT_SWORD,
    SWORD,
} from "@test/craftingFixture"
import { getAttemptCost, getCraftCost, getCraftsEach } from "./unitCost"

const data = makeCraftingData()
const PRICES = { [ORE]: 10, [SOLVENT]: 5 }

// A White Greatsword is transferred from Ore; a Splendent White one from a
// White one and 2 Solvent, unless crafting the White one procs it (25%).
const transferChain = makeCraftingData(
    [
        { id: 41, transfer: true, materials: [[ORE, 1]] },
        {
            id: 42,
            transfer: true,
            materials: [
                [41, 1],
                [SOLVENT, 2],
            ],
            combo: { base: 41, chance: 25, only: false },
        },
    ],
    [
        [ORE, "Ore", "common"],
        [SOLVENT, "Solvent", "common"],
        [41, "White Greatsword", "unique"],
        [42, "Splendent White Greatsword", "unique"],
    ],
)
// A Cooking recipe: 1 per craft, 30% of the time 2.
const STEW = 900
const cooking = makeCraftingData(
    [{ id: STEW, profession: "cooking", materials: [[ORE, 2]] }],
    [
        [ORE, "Ore", "common"],
        [STEW, "Stew", "common"],
    ],
)

describe("getCraftCost", () => {
    it("adds up priced materials, split over the yield", () => {
        const settings = makeSettings({ prices: PRICES })

        // (20 x 10 + 10 x 5) / 10 per craft.
        expect(getCraftCost(data, settings, INGOT)).toBe(25)
        // 3 Ingots and 5 Ore.
        expect(getCraftCost(data, settings, SWORD)).toBe(125)
    })

    it("splits a Cooking craft over 1.3 items", () => {
        // 2 Ore at 13 Kinah, over 1.3 Stew.
        expect(
            getCraftCost(
                cooking,
                makeSettings({ prices: { [ORE]: 13 } }),
                STEW,
            ),
        ).toBeCloseTo(20)
    })

    it("saves the skipped transfer's other materials", () => {
        // One White Greatsword (10), and 2 Solvent 75% of the time.
        expect(
            getCraftCost(transferChain, makeSettings({ prices: PRICES }), 42),
        ).toBeCloseTo(17.5)
    })

    it("spreads failures and combo procs over the crafts that work", () => {
        const failing = makeSettings({
            prices: PRICES,
            success: { [SWORD]: 50 },
        })

        expect(getCraftCost(data, failing, SWORD)).toBe(250)
        expect(
            getCraftCost(
                data,
                makeSettings({ prices: PRICES }),
                SPLENDENT_SWORD,
            ),
        ).toBe(500)
        // The Splendent Sword plus 2 Ingots.
        expect(
            getCraftCost(data, makeSettings({ prices: PRICES }), GREAT_SWORD),
        ).toBe(550)
    })

    it("uses a combo's lower-tier gear on every attempt", () => {
        // The Splendent Mace (5) is bought, so it counts at its price.
        const chain = makeCraftingData([
            { id: 5, category: "mace", materials: [[ORE, 1]] },
            { id: 11, category: "mace", materials: [[5, 1]] },
            {
                id: 21,
                category: "mace",
                materials: [
                    [5, 1],
                    [ORE, 2],
                ],
                combo: { base: 11, chance: 25, only: true },
            },
        ])
        const prices = { 5: 100, [ORE]: 10 }

        // 4 attempts, each a Mace and 2 Ore.
        expect(
            getCraftCost(
                chain,
                makeSettings({ prices: prices, bought: [5] }),
                21,
            ),
        ).toBe(480)
        // Half fail: 8 attempts.
        expect(
            getCraftCost(
                chain,
                makeSettings({
                    prices: prices,
                    bought: [5],
                    success: { 21: 50 },
                }),
                21,
            ),
        ).toBe(960)
    })

    it("counts a material at its Odyle's price when morphing is cheaper", () => {
        const odyle = 610610013
        const sapphire = 610660025
        const ring = makeCraftingData([{ id: 50, materials: [[sapphire, 2]] }])

        expect(
            getCraftCost(
                ring,
                makeSettings({ prices: { [odyle]: 4998, [sapphire]: 5892 } }),
                50,
            ),
        ).toBe(2 * 4998)
    })

    it("uses the price of bought items", () => {
        const settings = makeSettings({
            prices: { ...PRICES, [INGOT]: 30 },
            bought: [INGOT],
        })

        expect(getCraftCost(data, settings, SWORD)).toBe(140)
    })

    it("is unknown while a material has no price", () => {
        expect(
            getCraftCost(data, makeSettings({ prices: { [ORE]: 10 } }), SWORD),
        ).toBeNull()
    })

    it("prices an item a recipe loops back to at its own price", () => {
        const looped = makeCraftingData([
            { id: 1, materials: [[2, 1]] },
            { id: 2, materials: [[1, 2]] },
        ])

        expect(
            getCraftCost(looped, makeSettings({ prices: { 1: 7 } }), 1),
        ).toBe(14)
    })
})

describe("getAttemptCost", () => {
    it("takes the bound item it upgrades as already had", () => {
        // 2 Solvent; the White Greatsword and its own chain left out.
        expect(
            getAttemptCost(transferChain, makeSettings({ prices: PRICES }), 42),
        ).toBe(10)
    })

    it("counts each material at the cheaper of buying and crafting it", () => {
        // Ingots cost 25 to craft but sell for 20: 3 Ingots and 5 Ore.
        const settings = makeSettings({
            prices: PRICES,
            marketPrices: { [INGOT]: 20 },
        })

        expect(getAttemptCost(data, settings, SWORD)).toBe(110)
        expect(getCraftCost(data, settings, SWORD)).toBe(125)
    })

    it("is one craft's materials, whatever the success", () => {
        const settings = makeSettings({
            prices: PRICES,
            success: { [SWORD]: 50 },
        })

        expect(getAttemptCost(data, settings, SWORD)).toBe(125)
        expect(getCraftCost(data, settings, SWORD)).toBe(250)
    })

    it("is unknown while a material has no price", () => {
        expect(
            getAttemptCost(
                data,
                makeSettings({ prices: { [ORE]: 10 } }),
                SWORD,
            ),
        ).toBeNull()
    })
})

describe("getCraftsEach", () => {
    const getRecipe = (craftingData: typeof data, id: number) => {
        const recipe = craftingData.recipes.get(id)

        if (!recipe) {
            throw new Error("The fixture has this recipe.")
        }

        return recipe
    }

    it("is 1 for a craft that always succeeds", () => {
        expect(
            getCraftsEach(data, makeSettings(), getRecipe(data, SWORD)),
        ).toBe(1)
    })

    it("counts failures", () => {
        const settings = makeSettings({ success: { [SWORD]: 50 } })

        expect(getCraftsEach(data, settings, getRecipe(data, SWORD))).toBe(2)
    })

    it("counts a combo-only item's misses", () => {
        expect(
            getCraftsEach(
                data,
                makeSettings(),
                getRecipe(data, SPLENDENT_SWORD),
            ),
        ).toBe(4)
    })

    it("splits a craft over its yield and a Cooking double", () => {
        expect(
            getCraftsEach(data, makeSettings(), getRecipe(data, INGOT)),
        ).toBe(0.1)
        expect(
            getCraftsEach(cooking, makeSettings(), getRecipe(cooking, STEW)),
        ).toBeCloseTo(1 / 1.3)
    })
})
