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
import { getMaterialIndex } from "./materialOrder"

const data = makeCraftingData()

const getRows = (settings = makeSettings()) => {
    const plan = buildCraftPlan(data, settings, SWORD, 2)

    return getMaterialIndex(data, settings, plan).map((row) => {
        return { id: row.material.item.id, crafted: row.crafted }
    })
}

describe("getMaterialIndex", () => {
    it("lists every item but the main craft, Ingot before its Ore", () => {
        expect(getRows()).toEqual([
            { id: INGOT, crafted: true },
            { id: ORE, crafted: false },
            { id: SOLVENT, crafted: false },
        ])
    })

    it("keeps rows in place whatever the bag and Buy instead say", () => {
        expect(
            getRows(makeSettings({ owned: { [ORE]: 100 }, bought: [INGOT] })),
        ).toEqual([
            { id: INGOT, crafted: false },
            { id: ORE, crafted: false },
        ])
    })

    it("puts gear first, then crafted materials, then the rest by family and grade", () => {
        // A ring needs a Scale (made from Essence and a Hardener) and three
        // grades of Odyle; ids follow the game's families.
        const RING = 310330001
        const ESSENCE = 600590001
        const SCALE = 610730022
        const ODYLE = 610610013
        const FINE_ODYLE = 610610014
        const RADIANT_ODYLE = 610610016
        const HARDENER = 630520007
        const GEMSTONE = 610660025
        const DECORATION = 610730016
        const ring = makeCraftingData(
            [
                {
                    id: RING,
                    category: "ring",
                    materials: [
                        [SCALE, 1],
                        [ODYLE, 1],
                        [RADIANT_ODYLE, 1],
                        [FINE_ODYLE, 1],
                        [DECORATION, 1],
                    ],
                },
                {
                    id: DECORATION,
                    category: "materials",
                    materials: [[GEMSTONE, 1]],
                },
                {
                    id: SCALE,
                    category: "materials",
                    materials: [
                        [ESSENCE, 2],
                        [HARDENER, 1],
                    ],
                },
            ],
            [
                [RING, "Ring", "epic"],
                [ESSENCE, "Balaur's Essence", "epic"],
                [SCALE, "Enhanced Thick Balaur Scale", "epic"],
                [ODYLE, "Odyle", "common"],
                [FINE_ODYLE, "Fine Odyle", "rare"],
                [RADIANT_ODYLE, "Radiant Odyle", "unique"],
                [HARDENER, "Hardener", "common"],
                [GEMSTONE, "Sapphire Gemstone", "common"],
                [DECORATION, "Sapphire Decoration", "common"],
            ],
        )
        const settings = makeSettings()
        const plan = buildCraftPlan(ring, settings, RING, 1)

        expect(
            getMaterialIndex(ring, settings, plan).map((row) => {
                return row.material.item.name
            }),
        ).toEqual([
            "Enhanced Thick Balaur Scale",
            "Sapphire Decoration",
            "Balaur's Essence",
            "Radiant Odyle",
            "Fine Odyle",
            "Odyle",
            "Sapphire Gemstone",
            "Hardener",
        ])
    })
})
