import { setStoredItem } from "@account/sync/syncMeta"
import { CRAFTING_KEY } from "@account/sync/syncedKeys"
import { keepUnchanged } from "@common/keepUnchanged"
import { isProfessionId } from "@crafting/config/professions"
import type { CraftingSettings, LocalPrice } from "@crafting/types"
import { isRecord } from "@planner/storage/isRecord"
import { DEFAULT_SERVER_ID, isServerId } from "@timers/config/servers"

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
}

const isAmount = (value: unknown, min: number): value is number => {
    return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= min &&
        value <= MAX_AMOUNT
    )
}

const isSuccess = (value: unknown): value is number => {
    return isAmount(value, 1) && value <= 100
}

// Numbers by item id; bad entries are dropped one by one.
const pickNumbers = (
    value: unknown,
    isValid: (item: unknown) => item is number,
) => {
    const picked: Record<string, number> = {}

    if (!isRecord(value)) {
        return picked
    }

    for (const [id, item] of Object.entries(value)) {
        if (isValid(item)) {
            picked[id] = item
        }
    }

    return picked
}

const isOwned = (value: unknown): value is number => {
    return isAmount(value, 1)
}

const isLocalPrice = (value: unknown): value is LocalPrice => {
    return (
        isRecord(value) &&
        (value.value === null || isAmount(value.value, 0)) &&
        typeof value.at === "number" &&
        Number.isFinite(value.at)
    )
}

// Per server, then per item; bad entries are dropped one by one.
const pickPrices = (value: unknown) => {
    const picked: CraftingSettings["prices"] = {}

    if (!isRecord(value)) {
        return picked
    }

    for (const [server, perItem] of Object.entries(value)) {
        if (!isServerId(server) || !isRecord(perItem)) {
            continue
        }

        const prices: Record<string, LocalPrice> = {}

        for (const [id, price] of Object.entries(perItem)) {
            if (isLocalPrice(price)) {
                prices[id] = { value: price.value, at: price.at }
            }
        }

        picked[server] = prices
    }

    return picked
}

// Per profession; unknown professions and bad levels are dropped.
const pickProficiency = (value: unknown) => {
    const picked: CraftingSettings["proficiency"] = {}

    if (!isRecord(value)) {
        return picked
    }

    for (const [profession, level] of Object.entries(value)) {
        if (
            isProfessionId(profession) &&
            isAmount(level, 1) &&
            level <= MAX_PROFICIENCY
        ) {
            picked[profession] = level
        }
    }

    return picked
}

export const parseCraftingSettings = (value: unknown): CraftingSettings => {
    if (!isRecord(value)) {
        return EMPTY_SETTINGS
    }

    return {
        server: isServerId(value.server) ? value.server : DEFAULT_SERVER_ID,
        owned: pickNumbers(value.owned, isOwned),
        character:
            typeof value.character === "string" && value.character !== ""
                ? value.character
                : null,
        prices: pickPrices(value.prices),
        bought: Array.isArray(value.bought)
            ? [
                  ...new Set(
                      value.bought.filter((id): id is number =>
                          Number.isInteger(id),
                      ),
                  ),
              ]
            : [],
        // 100 is the default, so it isn't kept.
        success: pickNumbers(value.success, isSuccess),
        proficiency: pickProficiency(value.proficiency),
    }
}

const parse = (raw: string | null) => {
    if (raw === null) {
        return EMPTY_SETTINGS
    }

    try {
        return parseCraftingSettings(JSON.parse(raw))
    } catch {
        return EMPTY_SETTINGS
    }
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
