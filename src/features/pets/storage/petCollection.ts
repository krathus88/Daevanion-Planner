import { setStoredItem } from "@account/sync/syncMeta"
import { isPetLevel, levelFromSouls, PET_LEVELS } from "@pets/logic/petLevels"
import { isRecord } from "@planner/storage/isRecord"

export type PetCollection = {
    // Pet Insight level (1-3) by pet id; missing means locked.
    levels: Record<string, number>
    // Pet Insight levels whose pets the list and map leave out.
    hiddenLevels: number[]
    // The panel above the map is shrunk to one line.
    minimized: boolean
    // The "set your levels" tip was closed.
    tipDismissed: boolean
}

const KEY = "daevanion:pets:v1:collection"
const CHANGE_EVENT = "daevanion-pets-change"

const DEFAULT_COLLECTION: PetCollection = {
    levels: {},
    hiddenLevels: [],
    minimized: false,
    tipDismissed: false,
}

const pickHiddenLevels = (value: Record<string, unknown>) => {
    // Before per-level options, one switch hid every unlocked pet.
    if (value.hideUnlocked === true) {
        return PET_LEVELS
    }

    const stored = value.hiddenLevels

    if (!Array.isArray(stored)) {
        return DEFAULT_COLLECTION.hiddenLevels
    }

    // Known levels only, in order, without repeats.
    return PET_LEVELS.filter((level) => stored.includes(level))
}

const pickLevels = (value: Record<string, unknown>) => {
    const levels: Record<string, number> = {}

    if (isRecord(value.levels)) {
        for (const [id, level] of Object.entries(value.levels)) {
            if (isPetLevel(level)) {
                levels[id] = level
            }
        }
    } else if (isRecord(value.souls)) {
        // Older saves kept soul counts; keep the level they reached.
        for (const [id, souls] of Object.entries(value.souls)) {
            const level = typeof souls === "number" ? levelFromSouls(souls) : 0

            if (level > 0) {
                levels[id] = level
            }
        }
    }

    return levels
}

const parse = (raw: string | null): PetCollection => {
    if (raw === null) {
        return DEFAULT_COLLECTION
    }

    try {
        const value: unknown = JSON.parse(raw)

        if (!isRecord(value)) {
            return DEFAULT_COLLECTION
        }

        return {
            levels: pickLevels(value),
            hiddenLevels: pickHiddenLevels(value),
            minimized: value.minimized === true,
            tipDismissed: value.tipDismissed === true,
        }
    } catch {
        return DEFAULT_COLLECTION
    }
}

// useSyncExternalStore needs the same object back until the data changes.
let cached: { raw: string | null; collection: PetCollection } | null = null

export const readPetCollection = () => {
    let raw: string | null = null

    try {
        raw = window.localStorage.getItem(KEY)
    } catch {
        // Storage is blocked; fall back to the defaults.
    }

    if (!cached || cached.raw !== raw) {
        cached = { raw: raw, collection: parse(raw) }
    }

    return cached.collection
}

export const writePetCollection = (collection: PetCollection) => {
    try {
        setStoredItem(KEY, JSON.stringify(collection))
    } catch {
        // Nothing to do: the change only lasts until the page reloads.
        cached = { raw: null, collection: collection }
    }

    window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const subscribeToPetCollection = (onChange: () => void) => {
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === null || event.key === KEY) {
            onChange()
        }
    }

    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
        window.removeEventListener(CHANGE_EVENT, onChange)
        window.removeEventListener("storage", handleStorageChange)
    }
}
