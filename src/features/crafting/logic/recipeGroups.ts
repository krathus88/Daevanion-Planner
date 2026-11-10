import { CATEGORY_NAMES, PROFESSION_NAMES } from "@crafting/config/professions"
import type { RecipeEntry } from "./recipeList"

export type RecipeGroup = {
    key: string
    // The tab, or "Other" for items in none (Cooking's drinks).
    title: string
    profession: string
    entries: RecipeEntry[]
}

// The recipe list under tab headings: the entries are already sorted by
// profession and tab, so each run of one tab is a group.
export const groupRecipeEntries = (entries: RecipeEntry[]) => {
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
            }
            groups.push(current)
        }

        current.entries.push(entry)
    }

    return groups
}
