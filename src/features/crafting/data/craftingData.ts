import type { LootGrade } from "@config/items/grades"
import type { CategoryId, ProfessionId } from "@crafting/config/professions"
import type { ServerFaction } from "@timers/config/servers"
// Fetched as a file so the data downloads only on the Crafting page.
import recipesUrl from "./recipes.json?url"

export type ItemGrade = Exclude<LootGrade, "special">

export type CraftingItem = {
    id: number
    name: string
    grade: ItemGrade | null
}

// A Splendent item procs with `chance` % when its base item is crafted.
// "only": it can't be crafted directly; else it has a recipe of its own too.
type RecipeCombo = {
    base: number
    chance: number
    only: boolean
}

export type Recipe = {
    id: number
    profession: ProfessionId
    // The profession's tab; missing is only under All.
    category?: CategoryId
    // Only that faction's players see it; missing is both.
    faction?: ServerFaction
    // Transfer Crafting recipes have none.
    mastery?: number
    // In the game's Transfer Crafting window, not Crafting.
    transfer?: boolean
    // Items made per craft.
    yield: number
    // The game has this many recipes for the item; this is one of them.
    variants: number
    // [item id, count] per craft.
    materials: [number, number][]
    combo?: RecipeCombo
    // Index into CraftingData.chanceTables: the game's Crafting Chance by
    // proficiency level difference. Missing for Transfer Crafting.
    chances?: number
}

type RawCraftingData = {
    fetched: string
    chanceTables?: number[][]
    items: [number, string, ItemGrade | null][]
    recipes: Recipe[]
}

// A Splendent item crafting a recipe can make instead: the game's "Combo
// Activation Chance" on the base item.
type ComboProc = {
    id: number
    chance: number
}

export type CraftingData = {
    // Date the recipes were read, yyyy-mm-dd.
    fetched: string
    items: Map<number, CraftingItem>
    recipes: Map<number, Recipe>
    // By base item id: the combo items its crafts can proc.
    procs: Map<number, ComboProc[]>
    // Success percent by level difference (index), from NCSOFT's table; the
    // last value holds for any larger difference.
    chanceTables: number[][]
}

export const buildCraftingData = (raw: RawCraftingData): CraftingData => {
    const items = new Map<number, CraftingItem>()
    const recipes = new Map<number, Recipe>()

    for (const [id, name, grade] of raw.items) {
        items.set(id, { id: id, name: name, grade: grade })
    }

    const procs = new Map<number, ComboProc[]>()

    for (const recipe of raw.recipes) {
        recipes.set(recipe.id, recipe)

        if (recipe.combo) {
            const proc = { id: recipe.id, chance: recipe.combo.chance }

            procs.set(recipe.combo.base, [
                ...(procs.get(recipe.combo.base) ?? []),
                proc,
            ])
        }
    }

    return {
        fetched: raw.fetched,
        items: items,
        recipes: recipes,
        procs: procs,
        chanceTables: raw.chanceTables ?? [],
    }
}

// Every material is listed in items; this only guards a stale data file.
export const getItem = (data: CraftingData, id: number): CraftingItem => {
    return data.items.get(id) ?? { id: id, name: `Item ${id}`, grade: null }
}

export const getProcs = (data: CraftingData, id: number) => {
    return data.procs.get(id) ?? []
}

let pending: Promise<CraftingData> | null = null

const fetchCraftingData = async () => {
    const response = await fetch(recipesUrl)

    if (!response.ok) {
        throw new Error(`Recipe data failed to load (${response.status}).`)
    }

    return buildCraftingData(await response.json())
}

export const loadCraftingData = () => {
    if (!pending) {
        pending = fetchCraftingData().catch((error: unknown) => {
            // Let the next visit try again.
            pending = null
            throw error
        })
    }

    return pending
}
