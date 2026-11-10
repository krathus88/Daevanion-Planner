import { describe, expect, it } from "vitest"
import { makeCraftingData } from "@test/craftingFixture"
import {
    filterRecipeEntries,
    getListedId,
    getRecipeEntries,
    getStartWindow,
} from "./recipeList"

// Each faction has its own Sword. The Elyos one procs a Splendent Sword (not
// a recipe of its own in the game) for the True Greatsword; the White
// Greatsword is Transfer Crafting. Potions and Powder are for both factions.
const data = makeCraftingData(
    [
        {
            id: 11,
            category: "longsword",
            faction: "elyos",
            mastery: 3,
            materials: [[1, 1]],
        },
        {
            id: 12,
            category: "longsword",
            faction: "asmodians",
            mastery: 3,
            materials: [[1, 1]],
        },
        {
            id: 21,
            category: "longsword",
            faction: "elyos",
            mastery: 3,
            materials: [[1, 1]],
            combo: { base: 11, chance: 25, only: true },
        },
        {
            id: 31,
            category: "greatsword",
            faction: "elyos",
            mastery: 50,
            materials: [[21, 1]],
        },
        {
            id: 32,
            category: "greatsword",
            faction: "elyos",
            mastery: 40,
            materials: [[1, 1]],
        },
        {
            id: 41,
            category: "greatsword",
            faction: "elyos",
            transfer: true,
            materials: [[31, 1]],
        },
        {
            id: 100,
            profession: "alchemy",
            category: "potion",
            mastery: 5,
            materials: [[1, 1]],
        },
        {
            id: 101,
            profession: "alchemy",
            category: "materials",
            mastery: 1,
            materials: [[1, 1]],
        },
    ],
    [
        [1, "Ore", "common"],
        [11, "Sword", "rare"],
        [12, "Sword", "rare"],
        [21, "Splendent Sword", "epic"],
        [31, "True Greatsword", "unique"],
        [32, "Old Greatsword", "unique"],
        [41, "White Greatsword", "unique"],
        [100, "Potion", "common"],
        [101, "Powder", "common"],
    ],
)

const getIds = (entries: ReturnType<typeof getRecipeEntries>) => {
    return entries.map((entry) => entry.item.id)
}

describe("getRecipeEntries", () => {
    it("lists the faction's recipes by profession, tab, mastery, item", () => {
        expect(getIds(getRecipeEntries(data, "elyos"))).toEqual([
            32, 31, 41, 11, 100, 101,
        ])
    })

    it("leaves out the other faction's recipes", () => {
        expect(getIds(getRecipeEntries(data, "asmodians"))).toEqual([
            12, 100, 101,
        ])
    })

    it("lists transfers along their chain", () => {
        const chain = makeCraftingData([
            { id: 31, category: "mace", mastery: 55, materials: [[1, 1]] },
            { id: 52, category: "mace", transfer: true, materials: [[51, 1]] },
            { id: 51, category: "mace", transfer: true, materials: [[31, 1]] },
            { id: 50, category: "mace", transfer: true, materials: [[52, 1]] },
        ])

        expect(getIds(getRecipeEntries(chain, "elyos"))).toEqual([
            31, 51, 52, 50,
        ])
    })

    it("leaves out combo items, which come from their base's recipe", () => {
        expect(getIds(getRecipeEntries(data, "elyos"))).not.toContain(21)
    })

    it("gives each row its short level and combo", () => {
        const entries = new Map(
            getRecipeEntries(data, "elyos").map((entry) => [
                entry.item.id,
                entry,
            ]),
        )

        expect(entries.get(11)).toMatchObject({ level: "Lv. 3", combo: true })
        expect(entries.get(41)).toMatchObject({ level: null, combo: false })
    })
})

describe("filterRecipeEntries", () => {
    const entries = getRecipeEntries(data, "elyos")

    const filterIds = (...args: Parameters<typeof filterRecipeEntries>) => {
        return getIds(filterRecipeEntries(...args))
    }

    it("needs every word of the query, in any order", () => {
        expect(
            filterIds(entries, "crafting", "greatsword true", null, null),
        ).toEqual([31])
    })

    it("keeps Transfer Crafting recipes apart", () => {
        expect(filterIds(entries, "transfer", "", null, null)).toEqual([41])
        expect(filterIds(entries, "crafting", "white", null, null)).toEqual([])
    })

    it("keeps one profession, and one of its tabs", () => {
        expect(filterIds(entries, "crafting", "", "alchemy", null)).toEqual([
            100, 101,
        ])
        expect(
            filterIds(entries, "crafting", "", "alchemy", "materials"),
        ).toEqual([101])
    })

    it("ignores a tab without its profession", () => {
        expect(
            filterIds(entries, "crafting", "", null, "materials"),
        ).toHaveLength(5)
    })
})

describe("getStartWindow", () => {
    it("opens Transfer Crafting for a transfer item", () => {
        expect(getStartWindow(data, 41)).toBe("transfer")
        expect(getStartWindow(data, 11)).toBe("crafting")
        expect(getStartWindow(data, undefined)).toBe("crafting")
    })
})

describe("getListedId", () => {
    it("lists a combo item under the recipe that procs it", () => {
        expect(getListedId(data, 21)).toBe(11)
        expect(getListedId(data, 31)).toBe(31)
    })
})
