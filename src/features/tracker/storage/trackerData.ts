import { setStoredItem } from "@account/sync/syncMeta"
import { isClassId } from "@config/classPresets/classInfo"
import { isRecord } from "@planner/storage/isRecord"
import { DEFAULT_SERVER_ID, isServerId } from "@timers/config/servers"
import { FIRST_PRESETS, STARTER_TASKS } from "@tracker/config/starterTasks"
import { isTrackerReset } from "@tracker/config/trackerResets"
import {
    addIgnored,
    addNewPresets,
    getNewIgnoredPresets,
    renameOldPresets,
    STARTER_IDS,
} from "@tracker/logic/presetTasks"
import type {
    ArenaModes,
    ArenaSighting,
    TaskCount,
    TaskEntries,
    TrackerCharacter,
    TrackerData,
    TrackerTask,
} from "@tracker/types"

const KEY = "daevanion:tracker:v1:data"
const CHANGE_EVENT = "daevanion-tracker-change"

export const MAX_TASK_CAP = 999
export const MAX_SHORT_NOTE = 80
export const MAX_LONG_NOTE = 2000

const EMPTY_DATA: TrackerData = {
    characters: [],
    tasks: null,
    presets: STARTER_IDS,
    counts: {},
    entries: {},
    minimized: [],
    goalsOpen: [],
    ignored: {},
    energy: {},
    cubeKeys: {},
    arena: {},
    declined: [],
    notes: {},
    membership: true,
}

export const MAX_CUBE_KEYS = 9999

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

        return task
    }

    // The task dialogs can't set entries, so an own copy saved before a starter
    // task counted entries takes them from the starter task.
    const starter = STARTER_TASKS.find((item) => item.id === task.id)

    if (starter?.recharge !== undefined) {
        task.recharge = starter.recharge
        task.bonusCap = starter.bonusCap ?? 0
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

// Odyle Energy by character id; bad entries are dropped one by one.
const pickEnergy = (value: unknown) => {
    const energy: TrackerData["energy"] = {}

    if (!isRecord(value)) {
        return energy
    }

    for (const [characterId, entries] of Object.entries(value)) {
        if (isTaskEntries(entries)) {
            energy[characterId] = entries
        }
    }

    return energy
}

// Hidden Cube keys by character id; bad entries are dropped one by one.
const pickCubeKeys = (value: unknown) => {
    const keys: TrackerData["cubeKeys"] = {}

    if (!isRecord(value)) {
        return keys
    }

    for (const [characterId, count] of Object.entries(value)) {
        if (isWholeNumber(count, 0) && count <= MAX_CUBE_KEYS) {
            keys[characterId] = count
        }
    }

    return keys
}

const pickArenaSighting = (value: unknown): ArenaSighting | null => {
    if (
        !isRecord(value) ||
        !isWholeNumber(value.period, 0) ||
        !isWholeNumber(value.at, 0) ||
        !isRecord(value.modes)
    ) {
        return null
    }

    const modes: ArenaModes = {}

    for (const [mode, record] of Object.entries(value.modes)) {
        if (
            Array.isArray(record) &&
            record.length === 2 &&
            isWholeNumber(record[0], 0) &&
            isWholeNumber(record[1], 0)
        ) {
            modes[mode] = [record[0], record[1]]
        }
    }

    return { period: value.period, at: value.at, modes: modes }
}

// Arena records by character id; bad ones are dropped one by one.
const pickArena = (value: unknown) => {
    const arena: TrackerData["arena"] = {}

    if (!isRecord(value)) {
        return arena
    }

    for (const [characterId, record] of Object.entries(value)) {
        const seen = isRecord(record) ? pickArenaSighting(record.seen) : null

        if (!isRecord(record) || seen === null) {
            continue
        }

        const base = pickArenaSighting(record.base)

        arena[characterId] = base ? { seen: seen, base: base } : { seen: seen }
    }

    return arena
}

// Notes by character id; empty ones are dropped, overlong ones cut.
const pickNotes = (value: unknown) => {
    const notes: TrackerData["notes"] = {}

    if (!isRecord(value)) {
        return notes
    }

    for (const [characterId, note] of Object.entries(value)) {
        if (!isRecord(note)) {
            continue
        }

        const short =
            typeof note.short === "string"
                ? note.short.slice(0, MAX_SHORT_NOTE)
                : ""
        const long =
            typeof note.long === "string"
                ? note.long.slice(0, MAX_LONG_NOTE)
                : ""

        if (short.trim() !== "" || long.trim() !== "") {
            notes[characterId] = { short: short, long: long }
        }
    }

    return notes
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

// The user's own list, with starter tasks it didn't know of yet added.
const pickTasks = (
    value: Record<string, unknown>,
    known: readonly string[],
) => {
    if (!Array.isArray(value.tasks)) {
        return null
    }

    const tasks = renameOldPresets(pickById(value.tasks, parseTask), known)

    return [...addNewPresets(tasks, known)]
}

export const parseTrackerData = (value: unknown): TrackerData => {
    if (!isRecord(value)) {
        return EMPTY_DATA
    }

    const known = Array.isArray(value.presets)
        ? pickStrings(value.presets)
        : FIRST_PRESETS
    const characters = pickById(value.characters, parseCharacter)

    return {
        characters: characters,
        tasks: pickTasks(value, known),
        presets: STARTER_IDS,
        counts: pickPerOwner(value.counts, isTaskCount),
        entries: pickPerOwner(value.entries, isTaskEntries),
        minimized: pickStrings(value.minimized),
        goalsOpen: pickStrings(value.goalsOpen),
        // Starter tasks that start ignored do so for the characters already there.
        ignored: addIgnored(
            pickIgnored(value.ignored),
            characters.map((character) => character.id),
            getNewIgnoredPresets(known),
        ),
        energy: pickEnergy(value.energy),
        cubeKeys: pickCubeKeys(value.cubeKeys),
        arena: pickArena(value.arena),
        declined: pickStrings(value.declined),
        notes: pickNotes(value.notes),
        // Saves from before it existed assume the membership.
        membership: value.membership !== false,
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
    }

    // Keep the object written rather than parse it back: edits copy only
    // what they change, so every other character's counts stay the same
    // objects and their cards don't re-render.
    cached = { raw: readRaw(), data: data }

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
