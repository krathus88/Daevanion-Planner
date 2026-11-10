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
import {
    buildCraftPlan,
    getBuyPrice,
    getCraftChance,
    getPrice,
    getPriceState,
} from "./craftPlan"

const data = makeCraftingData()

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

const getStep = (plan: ReturnType<typeof buildCraftPlan>, id: number) => {
    return plan.steps.find((step) => step.item.id === id)
}

const getMaterial = (plan: ReturnType<typeof buildCraftPlan>, id: number) => {
    return plan.materials.find((material) => material.item.id === id)
}

describe("buildCraftPlan", () => {
    it("lists the target first, then what it's made from", () => {
        const plan = buildCraftPlan(data, makeSettings(), SWORD, 2)

        expect(plan.steps.map((step) => step.item.id)).toEqual([SWORD, INGOT])
        expect(getStep(plan, SWORD)).toMatchObject({
            need: 2,
            crafts: 2,
            attempts: 2,
        })
    })

    it("rounds crafts up by yield and adds up shared materials", () => {
        const plan = buildCraftPlan(data, makeSettings(), SWORD, 2)

        // 6 Ingots from one craft of 10.
        expect(getStep(plan, INGOT)).toMatchObject({ need: 6, crafts: 1 })
        // 2 Swords x 5 Ore, plus 20 for the Ingots.
        expect(getMaterial(plan, ORE)?.need).toBe(30)
        expect(getMaterial(plan, SOLVENT)?.need).toBe(10)
        expect(plan.attempts).toBe(3)
    })

    it("counts Cooking's double on average", () => {
        // 13 Stew at 1.3 a craft.
        expect(
            buildCraftPlan(cooking, makeSettings(), STEW, 13).steps[0],
        ).toMatchObject({
            crafts: 10,
            attempts: 10,
        })
        expect(
            buildCraftPlan(cooking, makeSettings(), STEW, 14).steps[0].crafts,
        ).toBe(11)
    })

    it("skips a transfer its base's combo makes directly", () => {
        const plan = buildCraftPlan(transferChain, makeSettings(), 42, 4)

        // 1 of the 4 comes straight from a White Greatsword proc: 3
        // transfers, still 4 White Greatswords.
        expect(getStep(plan, 42)).toMatchObject({
            crafts: 4,
            attempts: 3,
            skipped: { chance: 0.25, count: 1 },
        })
        expect(getStep(plan, 41)?.need).toBe(4)
        expect(getMaterial(plan, SOLVENT)?.need).toBe(6)
    })

    it("takes intermediates from the bag before crafting them", () => {
        const plan = buildCraftPlan(
            data,
            makeSettings({ owned: { [INGOT]: 6 } }),
            SWORD,
            2,
        )

        // Still shown, so its bag count can be changed back.
        expect(getStep(plan, INGOT)).toMatchObject({
            owned: 6,
            crafts: 0,
            attempts: 0,
        })
        expect(getMaterial(plan, ORE)?.need).toBe(10)
        expect(getMaterial(plan, SOLVENT)).toBeUndefined()
    })

    it("makes the whole count of the target, whatever is in the bag", () => {
        const plan = buildCraftPlan(
            data,
            makeSettings({ owned: { [SWORD]: 5 } }),
            SWORD,
            2,
        )

        expect(getStep(plan, SWORD)).toMatchObject({ owned: 0, crafts: 2 })
    })

    it("counts failed crafts from the success rate", () => {
        const plan = buildCraftPlan(
            data,
            makeSettings({ success: { [SWORD]: 50 } }),
            SWORD,
            2,
        )

        expect(getStep(plan, SWORD)).toMatchObject({
            crafts: 2,
            attempts: 4,
            // 4 attempts x 50% success x 25% combo.
            procs: [{ item: { id: SPLENDENT_SWORD }, chance: 25, count: 1 }],
        })
        // Every attempt uses the materials.
        expect(getStep(plan, INGOT)?.need).toBe(12)
    })

    it("counts the base crafts a combo item takes on average", () => {
        const plan = buildCraftPlan(data, makeSettings(), SPLENDENT_SWORD, 1)

        expect(getStep(plan, SPLENDENT_SWORD)).toMatchObject({
            crafts: 1,
            attempts: 4,
            chance: 0.25,
            leftover: { item: { id: SWORD }, count: 3 },
        })
        expect(getStep(plan, INGOT)?.need).toBe(12)
    })

    it("carries combo attempts through a chain", () => {
        const plan = buildCraftPlan(data, makeSettings(), GREAT_SWORD, 1)

        expect(getStep(plan, SPLENDENT_SWORD)?.attempts).toBe(4)
        // 2 for the Great Sword, 4 x 3 for the Splendent attempts.
        expect(getStep(plan, INGOT)).toMatchObject({ need: 14, crafts: 2 })
        expect(plan.attempts).toBe(1 + 4 + 2)
    })

    it("uses up a combo's lower-tier gear on every attempt", () => {
        // Expert's Splendent Mace (21) procs from Expert's Mace (11), both
        // taking a Splendent Mace (5); a miss makes an Expert's Mace and the
        // Splendent Mace is gone either way.
        const chain = makeCraftingData([
            { id: 5, category: "mace", materials: [[ORE, 1]] },
            {
                id: 11,
                category: "mace",
                materials: [
                    [5, 1],
                    [ORE, 6],
                ],
            },
            {
                id: 21,
                category: "mace",
                materials: [
                    [5, 1],
                    [ORE, 6],
                ],
                combo: { base: 11, chance: 25, only: true },
            },
        ])
        const sure = buildCraftPlan(chain, makeSettings(), 21, 1)
        const failing = buildCraftPlan(
            chain,
            makeSettings({ success: { 21: 50 } }),
            21,
            1,
        )

        expect(getStep(sure, 21)).toMatchObject({
            attempts: 4,
            leftover: { item: { id: 11 }, count: 3 },
        })
        expect(getStep(sure, 5)?.need).toBe(4)
        // 6 Ore per attempt, 1 per Splendent Mace.
        expect(getMaterial(sure, ORE)?.need).toBe(4 * 6 + 4)
        expect(getStep(failing, 21)?.attempts).toBe(8)
        expect(getStep(failing, 5)?.need).toBe(8)
    })

    it("never fails a Transfer Crafting recipe", () => {
        const transfer = makeCraftingData([
            { id: 41, transfer: true, materials: [[ORE, 2]] },
        ])
        const plan = buildCraftPlan(
            transfer,
            makeSettings({ success: { 41: 50 } }),
            41,
            3,
        )

        expect(getStep(plan, 41)).toMatchObject({ crafts: 3, attempts: 3 })
    })

    it("lists bought items as materials", () => {
        const plan = buildCraftPlan(
            data,
            makeSettings({ bought: [INGOT] }),
            SWORD,
            2,
        )

        expect(getStep(plan, INGOT)).toBeUndefined()
        expect(getMaterial(plan, INGOT)).toMatchObject({
            need: 6,
            craftable: true,
        })
        expect(getMaterial(plan, SOLVENT)).toBeUndefined()
    })

    it("crafts the target even when it's marked bought", () => {
        const plan = buildCraftPlan(
            data,
            makeSettings({ bought: [SWORD] }),
            SWORD,
            1,
        )

        expect(getStep(plan, SWORD)?.crafts).toBe(1)
    })

    it("prices what's missing and counts what has no price", () => {
        const plan = buildCraftPlan(
            data,
            makeSettings({
                owned: { [ORE]: 25 },
                prices: { [ORE]: 100 },
            }),
            SWORD,
            2,
        )

        expect(getMaterial(plan, ORE)).toMatchObject({
            owned: 25,
            missing: 5,
            price: 100,
            cost: 500,
        })
        expect(getMaterial(plan, SOLVENT)).toMatchObject({
            missing: 10,
            price: null,
            cost: null,
        })
        expect(plan.cost).toBe(500)
        expect(plan.unpriced).toBe(1)
    })

    it("treats an item a recipe loops back to as a material", () => {
        const looped = makeCraftingData([
            { id: 1, materials: [[2, 1]] },
            { id: 2, materials: [[1, 1]] },
        ])
        const plan = buildCraftPlan(looped, makeSettings(), 1, 1)

        expect(plan.steps.map((step) => step.item.id)).toEqual([1, 2])
        expect(plan.materials.map((material) => material.item.id)).toEqual([1])
    })
})

describe("getCraftChance", () => {
    it("multiplies success by a combo item's proc chance", () => {
        const recipe = data.recipes.get(SPLENDENT_SWORD)

        expect(recipe && getCraftChance(recipe, 80)).toBeCloseTo(0.2)
    })
})

// Real ids: Substance Morph is kept by item id.
const ODYLE = 610610013
const SAPPHIRE = 610660025

describe("getPriceState", () => {
    const SALT = 630554002

    it("shows a merchant's price first, fixed", () => {
        const settings = makeSettings({
            prices: { [SALT]: 1 },
            marketPrices: { [SALT]: 999 },
        })

        expect(getPriceState(settings, SALT)).toEqual({
            kind: "listed",
            price: { value: 220, source: "merchant" },
        })
        expect(getPrice(settings, SALT)).toBe(220)
    })

    it("loads, then shows the market's price, else the field", () => {
        expect(
            getPriceState(
                makeSettings({ pendingPrices: { [ORE]: true } }),
                ORE,
            ),
        ).toEqual({ kind: "loading" })
        expect(
            getPriceState(makeSettings({ marketPrices: { [ORE]: 12 } }), ORE),
        ).toEqual({ kind: "listed", price: { value: 12, source: "market" } })
        expect(
            getPriceState(makeSettings({ prices: { [ORE]: 10 } }), ORE),
        ).toEqual({ kind: "own", value: 10 })
    })
})

describe("getPrice", () => {
    it("takes the market's price, else one set by hand", () => {
        const settings = makeSettings({
            prices: { [ORE]: 10 },
            marketPrices: { [ORE]: 12, [SOLVENT]: 7 },
        })

        expect(getPrice(settings, ORE)).toBe(12)
        expect(getPrice(settings, SOLVENT)).toBe(7)
        expect(getPrice(settings, INGOT)).toBeNull()
    })
})

describe("getBuyPrice", () => {
    it("takes the Odyle's price when morphing is cheaper", () => {
        const settings = makeSettings({
            prices: { [ODYLE]: 4998, [SAPPHIRE]: 5892 },
        })

        expect(getBuyPrice(settings, SAPPHIRE)).toEqual({
            value: 4998,
            morph: ODYLE,
        })
    })

    it("keeps the material's own price when that's cheaper", () => {
        const settings = makeSettings({
            prices: { [ODYLE]: 6000, [SAPPHIRE]: 5892 },
        })

        expect(getBuyPrice(settings, SAPPHIRE)).toEqual({
            value: 5892,
            morph: null,
        })
    })

    it("uses the Odyle's price for a material with none", () => {
        expect(
            getBuyPrice(makeSettings({ prices: { [ODYLE]: 10 } }), SAPPHIRE),
        ).toEqual({ value: 10, morph: ODYLE })
        expect(getBuyPrice(makeSettings(), SAPPHIRE)).toEqual({
            value: null,
            morph: null,
        })
    })

    it("only morphs the materials Odyle makes", () => {
        expect(
            getBuyPrice(makeSettings({ prices: { [ODYLE]: 10 } }), ORE),
        ).toEqual({ value: null, morph: null })
    })
})

describe("buildCraftPlan: Substance Morph", () => {
    it("prices a missing material at its Odyle's price", () => {
        const data = makeCraftingData(
            [{ id: 50, materials: [[SAPPHIRE, 3]] }],
            [
                [ODYLE, "Odyle", "common"],
                [SAPPHIRE, "Sapphire Gemstone", "common"],
                [50, "Ring", "rare"],
            ],
        )
        const plan = buildCraftPlan(
            data,
            makeSettings({ prices: { [ODYLE]: 4998, [SAPPHIRE]: 5892 } }),
            50,
            1,
        )

        expect(plan.materials[0]).toMatchObject({
            price: 5892,
            cost: 3 * 4998,
            morph: { item: { name: "Odyle" }, price: 4998 },
        })
        expect(plan.cost).toBe(3 * 4998)
    })
})
