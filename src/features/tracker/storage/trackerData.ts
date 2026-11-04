import { setStoredItem } from "@account/sync/syncMeta"
import { isClassId } from "@config/classPresets/classInfo"
import { isRecord } from "@planner/storage/isRecord"
import { DEFAULT_SERVER_ID, isServerId } from "@timers/config/servers"
import { isTrackerReset } from "@tracker/config/trackerResets"
import type {
    TaskCount,
    TaskEntries,
    TrackerCharacter,
    TrackerData,
    TrackerTask,
} from "@tracker/types"

const KEY = "daevanion:tracker:v1:data"
const CHANGE_EVENT = "daevanion-tracker-change"

export const MAX_TASK_CAP = 999

const EMPTY_DATA: TrackerData = {
    characters: [],
    tasks: null,
    counts: {},
    entries: {},
    minimized: [],
    ignored: {},
}

const isWholeNumber = (value: unknown, min: number): value is number => {
    return typeof value === "number" && Number.isInteger(value) && value >= min
}

const isTaskCap = (value: unknown): value is number => {
    return isWholeNumber(value, 1) && value <= MAX_TASK_CAP
}

// Saves from before servers existed get the default server.
const parseCharacter = (value: unknown): TrackerCharacter | null => {
    if (
        !isRecord(value) ||
        typeof value.id !== "string" ||
        typeof value.name !== "string" ||
        typeof value.classId !== "string" ||
        !isClassId(value.classId)
    ) {
        return null
    }

    return {
        id: value.id,
        name: value.name,
        classId: value.classId,
        server: isServerId(value.server) ? value.server : DEFAULT_SERVER_ID,
    }
}

// Saves from before shared tasks existed are per character.
const parseTask = (value: unknown): TrackerTask | null => {
    if (
        !isRecord(value) ||
        typeof value.id !== "string" ||
        typeof value.name !== "string" ||
        !isTrackerReset(value.reset) ||
        !isTaskCap(value.cap)
    ) {
        return null
    }

    const task: TrackerTask = {
        id: value.id,
        name: value.name,
        reset: value.reset,
        cap: value.cap,
        shared: value.shared === true,
    }

    if (typeof value.subtitle === "string" && value.subtitle !== "") {
        task.subtitle = value.subtitle
    }

    if (isTaskCap(value.recharge)) {
        task.recharge = value.recharge
        task.bonusCap = isWholeNumber(value.bonusCap, 0) ? value.bonusCap : 0
    }

    return task
}

const isTaskCount = (value: unknown): value is TaskCount => {
    return (
        isRecord(value) &&
        Number.isInteger(value.period) &&
        isWholeNumber(value.count, 0)
    )
}

const isTaskEntries = (value: unknown): value is TaskEntries => {
    return (
        isRecord(value) &&
        Number.isInteger(value.period) &&
        isWholeNumber(value.base, 0) &&
        isWholeNumber(value.bonus, 0)
    )
}

// Drops whatever doesn't parse, entry by entry, keeping the first of each id.
const pickById = <T extends { id: string }>(
    value: unknown,
    parseItem: (item: unknown) => T | null,
) => {
    const picked: T[] = []
    const seen = new Set<string>()

    if (!Array.isArray(value)) {
        return picked
    }

    for (const item of value) {
        const parsed = parseItem(item)

        if (parsed && !seen.has(parsed.id)) {
            picked.push(parsed)
            seen.add(parsed.id)
        }
    }

    return picked
}

// Per owner, then per task; bad entries are dropped one by one.
const pickPerOwner = <T>(
    value: unknown,
    isValid: (item: unknown) => item is T,
) => {
    const picked: Record<string, Record<string, T>> = {}

    if (!isRecord(value)) {
        return picked
    }

    for (const [owner, perTask] of Object.entries(value)) {
        if (!isRecord(perTask)) {
            continue
        }

        const ownerItems: Record<string, T> = {}

        for (const [taskId, item] of Object.entries(perTask)) {
            if (isValid(item)) {
                ownerItems[taskId] = item
            }
        }

        picked[owner] = ownerItems
    }

    return picked
}

const pickStrings = (value: unknown) => {
    return Array.isArray(value)
        ? value.filter((item): item is string => typeof item === "string")
        : []
}

const pickIgnored = (value: unknown) => {
    const ignored: TrackerData["ignored"] = {}

    if (!isRecord(value)) {
        return ignored
    }

    for (const [owner, taskIds] of Object.entries(value)) {
        const picked = pickStrings(taskIds)

        if (picked.length > 0) {
            ignored[owner] = picked
        }
    }

    return ignored
}

export const parseTrackerData = (value: unknown): TrackerData => {
    if (!isRecord(value)) {
        return EMPTY_DATA
    }

    return {
        characters: pickById(value.characters, parseCharacter),
        tasks: Array.isArray(value.tasks)
            ? pickById(value.tasks, parseTask)
            : null,
        counts: pickPerOwner(value.counts, isTaskCount),
        entries: pickPerOwner(value.entries, isTaskEntries),
        minimized: pickStrings(value.minimized),
        ignored: pickIgnored(value.ignored),
    }
}

const parse = (raw: string | null) => {
    if (raw === null) {
        return EMPTY_DATA
    }

    try {
        return parseTrackerData(JSON.parse(raw))
    } catch {
        return EMPTY_DATA
    }
}

// useSyncExternalStore needs the same object back until the data changes.
let cached: { raw: string | null; data: TrackerData } | null = null

const readRaw = () => {
    try {
        return window.localStorage.getItem(KEY)
    } catch {
        // Storage is blocked; start empty.
        return null
    }
}

export const readTrackerData = () => {
    const raw = readRaw()

    if (!cached || cached.raw !== raw) {
        cached = { raw: raw, data: parse(raw) }
    }

    return cached.data
}

export const writeTrackerData = (data: TrackerData) => {
    try {
        setStoredItem(KEY, JSON.stringify(data))
    } catch {
        // Nothing to do: the change only lasts until the page reloads.
        cached = { raw: readRaw(), data: data }
    }

    window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const subscribeToTrackerData = (onChange: () => void) => {
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
