import type { CraftingSettings } from "@crafting/types"
import type { CraftingWindow } from "./recipeList"

// Whose favorites: the picked character on its server, or "" with none.
export const getFavoritesKey = (settings: CraftingSettings) => {
    return settings.character === null
        ? ""
        : `${settings.server}/${settings.character}`
}

// A list section as saved: "crafting/blacksmithing:mace".
export const getSectionKey = (
    craftWindow: CraftingWindow,
    groupKey: string,
) => {
    return `${craftWindow}/${groupKey}`
}

// The picked character's starred sections in this window, by group key.
export const getFavoriteSections = (
    settings: CraftingSettings,
    craftWindow: CraftingWindow,
) => {
    const prefix = `${craftWindow}/`
    const keys: string[] = []

    for (const section of settings.favorites[getFavoritesKey(settings)] ?? []) {
        if (section.startsWith(prefix)) {
            keys.push(section.slice(prefix.length))
        }
    }

    return keys
}
