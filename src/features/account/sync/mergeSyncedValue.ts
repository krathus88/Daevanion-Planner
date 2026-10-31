import { MAX_PLANNER_HISTORY } from "@planner/storage/boardStorage"
import { isRecord } from "@planner/storage/isRecord"
import { PETS_KEY } from "./syncedKeys"

// Lists merged by entry id, with how many entries each keeps.
const LIST_LIMITS: Record<string, number> = {
    ":saved-boards": Infinity,
    ":saved-planners": Infinity,
    ":planner-history": MAX_PLANNER_HISTORY,
}

const getListLimit = (key: string) => {
    for (const [suffix, limit] of Object.entries(LIST_LIMITS)) {
        if (key.endsWith(suffix)) {
            return limit
        }
    }

    return null
}

const getCreatedAt = (entry: unknown) => {
    return isRecord(entry) && typeof entry.createdAt === "number"
        ? entry.createdAt
        : 0
}

// Both sides' entries, newest first; an entry on both sides keeps the newer
// side's copy.
const mergeLists = (newer: unknown[], older: unknown[], limit: number) => {
    const byId = new Map<string, unknown>()

    for (const entry of [...newer, ...older]) {
        if (isRecord(entry) && typeof entry.id === "string") {
            if (!byId.has(entry.id)) {
                byId.set(entry.id, entry)
            }
        }
    }

    const merged = [...byId.values()]

    merged.sort((a, b) => getCreatedAt(b) - getCreatedAt(a))

    return merged.slice(0, limit)
}

// Each pet at the higher of its two values, for levels and souls.
const mergePetValues = (
    newer: Record<string, unknown>,
    older: Record<string, unknown>,
) => {
    const merged: Record<string, unknown> = { ...newer }

    for (const [id, value] of Object.entries(older)) {
        const current = merged[id]

        if (
            typeof value === "number" &&
            (typeof current !== "number" || value > current)
        ) {
            merged[id] = value
        }
    }

    return merged
}

// Combines what can be combined: saved lists and pet levels. Anything else
// comes from the side edited last.
export const mergeSyncedValue = (
    key: string,
    device: unknown,
    account: unknown,
    deviceIsNewer: boolean,
) => {
    const newer = deviceIsNewer ? device : account
    const older = deviceIsNewer ? account : device
    const limit = getListLimit(key)

    if (limit !== null && Array.isArray(newer) && Array.isArray(older)) {
        return mergeLists(newer, older, limit)
    }

    if (
        key === PETS_KEY &&
        isRecord(newer) &&
        isRecord(older) &&
        isRecord(newer.levels) &&
        isRecord(older.levels)
    ) {
        return {
            ...newer,
            levels: mergePetValues(newer.levels, older.levels),
            souls: mergePetValues(
                isRecord(newer.souls) ? newer.souls : {},
                isRecord(older.souls) ? older.souls : {},
            ),
        }
    }

    return newer
}
