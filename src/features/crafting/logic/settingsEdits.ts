import type { ProfessionId } from "@crafting/config/professions"
import type { CraftingSettings } from "@crafting/types"
import { getFavoritesKey } from "./favorites"

// Sets one item's number, or removes it when it's the default, so defaults
// aren't saved.
const setNumber = (
    values: Record<string, number>,
    id: number,
    value: number,
    fallback: number,
) => {
    const next = { ...values }

    if (value === fallback) {
        delete next[id]
    } else {
        next[id] = value
    }

    return next
}

export const setServer = (
    settings: CraftingSettings,
    server: string,
): CraftingSettings => {
    return { ...settings, server: server }
}

export const setCharacter = (
    settings: CraftingSettings,
    character: string | null,
): CraftingSettings => {
    return { ...settings, character: character }
}

export const setOwned = (
    settings: CraftingSettings,
    id: number,
    owned: number,
): CraftingSettings => {
    return { ...settings, owned: setNumber(settings.owned, id, owned, 0) }
}

// A price on the settings' server, as of `at`. Null clears it (and hides an
// older shared price); 0 is a price (free).
export const setPrice = (
    settings: CraftingSettings,
    id: number,
    price: number | null,
    at: number,
): CraftingSettings => {
    const server = settings.server

    return {
        ...settings,
        prices: {
            ...settings.prices,
            [server]: {
                ...settings.prices[server],
                [id]: { value: price, at: at },
            },
        },
    }
}

// Null goes back to the game's table (or 100 without one).
export const setSuccess = (
    settings: CraftingSettings,
    id: number,
    success: number | null,
): CraftingSettings => {
    const next = { ...settings.success }

    if (success === null) {
        delete next[id]
    } else {
        next[id] = Math.min(100, Math.max(1, success))
    }

    return { ...settings, success: next }
}

// Null clears it.
export const setProficiency = (
    settings: CraftingSettings,
    profession: ProfessionId,
    level: number | null,
): CraftingSettings => {
    const next = { ...settings.proficiency }

    if (level === null) {
        delete next[profession]
    } else {
        next[profession] = level
    }

    return { ...settings, proficiency: next }
}

export const setBought = (
    settings: CraftingSettings,
    id: number,
    bought: boolean,
): CraftingSettings => {
    const others = settings.bought.filter((item) => item !== id)

    return { ...settings, bought: bought ? [...others, id] : others }
}

// Stars or unstars a list section ("crafting/blacksmithing:mace") for the
// settings' character; an emptied list is dropped.
export const setFavorite = (
    settings: CraftingSettings,
    section: string,
    favorite: boolean,
): CraftingSettings => {
    const key = getFavoritesKey(settings)
    const others = (settings.favorites[key] ?? []).filter((item) => {
        return item !== section
    })
    const next = { ...settings.favorites }

    if (favorite) {
        next[key] = [...others, section]
    } else if (others.length > 0) {
        next[key] = others
    } else {
        delete next[key]
    }

    return { ...settings, favorites: next }
}
