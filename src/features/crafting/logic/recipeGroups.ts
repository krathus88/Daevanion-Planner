import { CATEGORY_NAMES, PROFESSION_NAMES } from "@crafting/config/professions"
import type { RecipeEntry } from "./recipeList"

export type RecipeGroup = {
    // "<profession>:<category>" ("other" for none): what a star is saved as.
    key: string
    // The tab, or "Other" for items in none (Cooking's drinks).
    title: string
    profession: string
    entries: RecipeEntry[]
    // Starred: listed first.
    favorite: boolean
}

// The recipe list under tab headings: the entries are already sorted by
// profession and tab, so each run of one tab is a group. Starred groups come
// first, each keeping its place among the others.
export const groupRecipeEntries = (
    entries: RecipeEntry[],
    favoriteKeys: readonly string[],
) => {
    const favorites = new Set(favoriteKeys)
    const groups: RecipeGroup[] = []

    for (const entry of entries) {
        const category = entry.recipe.category
        const key = `${entry.recipe.profession}:${category ?? "other"}`
        let current = groups.at(-1)

        if (current?.key !== key) {
            current = {
                key: key,
                title: category ? CATEGORY_NAMES[category] : "Other",
                profession: PROFESSION_NAMES[entry.recipe.profession],
                entries: [],
                favorite: favorites.has(key),
            }
            groups.push(current)
        }

        current.entries.push(entry)
    }

    return [
        ...groups.filter((group) => group.favorite),
        ...groups.filter((group) => !group.favorite),
    ]
}
