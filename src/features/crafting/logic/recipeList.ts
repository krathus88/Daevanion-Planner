import {
    PROFESSION_CATEGORIES,
    PROFESSION_IDS,
    type CategoryId,
    type ProfessionId,
} from "@crafting/config/professions"
import {
    getItem,
    getProcs,
    type CraftingData,
    type CraftingItem,
    type Recipe,
} from "@crafting/data/craftingData"
import type { ServerFaction } from "@timers/config/servers"
import { formatShortMastery } from "./recipeLabels"

export type RecipeEntry = {
    item: CraftingItem
    recipe: Recipe
    // The level, short ("Lv. 15", "Pro 5"); null for Transfer Crafting.
    level: string | null
    // Its crafts can proc a Splendent item.
    combo: boolean
    // Where it sorts within its tab: the mastery, or for a transfer how far
    // along its chain it is.
    rank: number
}

// The game's two windows: Crafting, and Transfer Crafting.
export type CraftingWindow = "crafting" | "transfer"

// Where an entry sorts within its profession: by tab, items in none last.
const getCategoryOrder = (recipe: Recipe) => {
    const categories = PROFESSION_CATEGORIES[recipe.profession]

    return recipe.category ? categories.indexOf(recipe.category) : Infinity
}

// Transfers sort after every mastery level.
const TRANSFER_RANK = 1000

// Transfers come in a chain (Splendent True → White → Splendent White …),
// each made from the one before: its first material, the transfer material.
const getTransferStep = (data: CraftingData, recipe: Recipe) => {
    const seen = new Set<number>()
    let step = 0
    let source = data.recipes.get(recipe.materials[0]?.[0])

    while (source?.transfer && !seen.has(source.id)) {
        seen.add(source.id)
        step++
        source = data.recipes.get(source.materials[0]?.[0])
    }

    return step
}

const compareEntries = (a: RecipeEntry, b: RecipeEntry) => {
    const profession =
        PROFESSION_IDS.indexOf(a.recipe.profession) -
        PROFESSION_IDS.indexOf(b.recipe.profession)
    const category = getCategoryOrder(a.recipe) - getCategoryOrder(b.recipe)
    const mastery = a.rank - b.rank

    if (profession !== 0) {
        return profession
    }

    if (category !== 0 && !Number.isNaN(category)) {
        return category
    }

    if (mastery !== 0 && !Number.isNaN(mastery)) {
        return mastery
    }

    // The game keeps a level's recipes in item order.
    return a.item.id - b.item.id
}

// The list row for an open item: its own, or for a combo-only (Splendent)
// item, which isn't a recipe of its own in the game, the recipe that procs it.
export const getListedId = (data: CraftingData, itemId: number) => {
    const combo = data.recipes.get(itemId)?.combo

    return combo?.only ? combo.base : itemId
}

// The window to open with: Transfer Crafting when the item opened from the
// URL is one, so its row is in the list.
export const getStartWindow = (
    data: CraftingData,
    itemId: number | undefined,
): CraftingWindow => {
    const recipe = itemId === undefined ? undefined : data.recipes.get(itemId)

    return recipe?.transfer ? "transfer" : "crafting"
}

// The recipes a faction's players see, like the game's crafting windows: by
// profession, then tab, then mastery (transfers along their chain), then
// item id. A combo (Splendent) item that's never crafted directly isn't a
// recipe of its own in the game, just the 25% outcome of its base's; plans
// still use it.
export const getRecipeEntries = (
    data: CraftingData,
    faction: ServerFaction,
) => {
    const entries: RecipeEntry[] = []

    for (const recipe of data.recipes.values()) {
        if (recipe.faction && recipe.faction !== faction) {
            continue
        }

        if (recipe.combo?.only) {
            continue
        }

        entries.push({
            item: getItem(data, recipe.id),
            recipe: recipe,
            level:
                recipe.mastery === undefined
                    ? null
                    : formatShortMastery(recipe.mastery),
            combo: getProcs(data, recipe.id).length > 0,
            rank: recipe.transfer
                ? TRANSFER_RANK + getTransferStep(data, recipe)
                : (recipe.mastery ?? Infinity),
        })
    }

    return entries.sort(compareEntries)
}

// Every word of the query has to be in the name, in any order. A tab only
// counts within its profession.
export const filterRecipeEntries = (
    entries: RecipeEntry[],
    craftWindow: CraftingWindow,
    query: string,
    profession: ProfessionId | null,
    category: CategoryId | null,
) => {
    const words = query.toLowerCase().split(/\s+/).filter(Boolean)
    const filtered: RecipeEntry[] = []

    for (const entry of entries) {
        const name = entry.item.name.toLowerCase()

        if ((entry.recipe.transfer === true) !== (craftWindow === "transfer")) {
            continue
        }

        if (profession && entry.recipe.profession !== profession) {
            continue
        }

        if (profession && category && entry.recipe.category !== category) {
            continue
        }

        if (words.every((word) => name.includes(word))) {
            filtered.push(entry)
        }
    }

    return filtered
}
