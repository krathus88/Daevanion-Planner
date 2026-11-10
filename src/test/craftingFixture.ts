import {
    buildCraftingData,
    type ItemGrade,
    type Recipe,
} from "@crafting/data/craftingData"
import type { CraftingSettings, PlanSettings } from "@crafting/types"

type TestRecipe = Partial<Recipe> & Pick<Recipe, "id" | "materials">

// Ore and Solvent are raw. Ingot (10 per craft) is smelted from them; a
// Sword takes Ingots and Ore. A Splendent Sword isn't crafted directly: it
// procs 25% of the time a Sword is crafted. A Great Sword takes one.
export const ORE = 1
export const SOLVENT = 2
export const INGOT = 10
export const SWORD = 20
export const SPLENDENT_SWORD = 21
export const GREAT_SWORD = 30

const ITEMS: [number, string, ItemGrade | null][] = [
    [ORE, "Ore", "common"],
    [SOLVENT, "Solvent", "common"],
    [INGOT, "Ingot", "common"],
    [SWORD, "Sword", "rare"],
    [SPLENDENT_SWORD, "Splendent Sword", "epic"],
    [GREAT_SWORD, "Great Sword", "unique"],
]

const RECIPES: TestRecipe[] = [
    {
        id: INGOT,
        mastery: 25,
        yield: 10,
        materials: [
            [ORE, 20],
            [SOLVENT, 10],
        ],
    },
    {
        id: SWORD,
        mastery: 3,
        materials: [
            [INGOT, 3],
            [ORE, 5],
        ],
    },
    {
        id: SPLENDENT_SWORD,
        mastery: 3,
        materials: [
            [INGOT, 3],
            [ORE, 5],
        ],
        combo: { base: SWORD, chance: 25, only: true },
    },
    {
        id: GREAT_SWORD,
        mastery: 30,
        materials: [
            [SPLENDENT_SWORD, 1],
            [INGOT, 2],
        ],
    },
]

export const makeRecipe = (recipe: TestRecipe): Recipe => {
    return {
        profession: "blacksmithing",
        yield: 1,
        variants: 1,
        ...recipe,
    }
}

export const makeCraftingData = (
    recipes: TestRecipe[] = RECIPES,
    items: [number, string, ItemGrade | null][] = ITEMS,
) => {
    return buildCraftingData({
        fetched: "2026-11-10",
        items: items,
        recipes: recipes.map(makeRecipe),
    })
}

export const makeSettings = (
    settings: Partial<PlanSettings> = {},
): PlanSettings => {
    return {
        owned: {},
        prices: {},
        marketPrices: {},
        pendingPrices: {},
        bought: [],
        success: {},
        proficiency: {},
        ...settings,
    }
}

export const makeCraftingSettings = (
    settings: Partial<CraftingSettings> = {},
): CraftingSettings => {
    return {
        server: "siel",
        owned: {},
        prices: {},
        bought: [],
        success: {},
        proficiency: {},
        ...settings,
    }
}
