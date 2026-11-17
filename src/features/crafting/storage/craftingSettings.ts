import { setStoredItem } from "@account/sync/syncMeta"
import { CRAFTING_KEY } from "@account/sync/syncedKeys"
import { keepUnchanged } from "@common/keepUnchanged"
import {
    entriesOf,
    finiteNumber,
    guarded,
    itemsOf,
    parseStored,
    validEntries,
    validItems,
    wholeNumber,
} from "@common/schemas"
import { isProfessionId } from "@crafting/config/professions"
import type { CraftingSettings } from "@crafting/types"
import { DEFAULT_SERVER_ID, isServerId } from "@timers/config/servers"
import * as v from "valibot"

const CHANGE_EVENT = "daevanion-crafting-change"

// Bag counts and Kinah prices; prices reach the billions.
export const MAX_AMOUNT = 999_999_999_999

// Proficiency levels run 1-50 per rank; room for a few ranks.
const MAX_PROFICIENCY = 200

const EMPTY_SETTINGS: CraftingSettings = {
    server: DEFAULT_SERVER_ID,
    owned: {},
    character: null,
    prices: {},
    bought: [],
    success: {},
    proficiency: {},
    favorites: {},
}

const amount = (min: number) => {
    return wholeNumber(min, MAX_AMOUNT)
}

const LocalPriceSchema = v.object({
    value: v.nullable(amount(0)),
    at: finiteNumber,
})

const SettingsSchema = v.object({
    server: v.fallback(guarded(isServerId), DEFAULT_SERVER_ID),
    owned: validEntries(amount(1)),
    character: v.fallback(v.nullable(v.pipe(v.string(), v.minLength(1))), null),
    // Per server, then per item; a server's prices that aren't an object are
    // dropped whole.
    prices: validEntries(entriesOf(LocalPriceSchema), isServerId),
    bought: v.pipe(
        validItems(v.pipe(v.number(), v.integer())),
        v.transform((ids) => {
            return [...new Set(ids)]
        }),
    ),
    // 100 is the default, so it isn't kept.
    success: validEntries(wholeNumber(1, 100)),
    proficiency: validEntries(wholeNumber(1, MAX_PROFICIENCY), isProfessionId),
    // Per character; a character's list that isn't an array is dropped.
    favorites: validEntries(
        v.pipe(
            itemsOf(v.pipe(v.string(), v.minLength(1))),
            v.transform((ids) => {
                return [...new Set(ids)]
            }),
        ),
    ),
})

export const parseCraftingSettings = (value: unknown): CraftingSettings => {
    return v.parse(v.fallback(SettingsSchema, EMPTY_SETTINGS), value)
}

const parse = (raw: string | null) => {
    return parseStored(SettingsSchema, raw, EMPTY_SETTINGS)
}

// useSyncExternalStore needs the same object back until the data changes.
let cached: { raw: string | null; settings: CraftingSettings } | null = null

const readRaw = () => {
    try {
        return window.localStorage.getItem(CRAFTING_KEY)
    } catch {
        // Storage is blocked; start empty.
        return null
    }
}

export const readCraftingSettings = () => {
    const raw = readRaw()

    if (!cached || cached.raw !== raw) {
        // Parts the change left alone keep their identity: only what changed
        // re-renders.
        cached = {
            raw: raw,
            settings: keepUnchanged(cached?.settings, parse(raw)),
        }
    }

    return cached.settings
}

export const writeCraftingSettings = (settings: CraftingSettings) => {
    try {
        setStoredItem(CRAFTING_KEY, JSON.stringify(settings))
    } catch {
        // Nothing to do: the change only lasts until the page reloads.
    }

    window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const subscribeToCraftingSettings = (onChange: () => void) => {
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === null || event.key === CRAFTING_KEY) {
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
