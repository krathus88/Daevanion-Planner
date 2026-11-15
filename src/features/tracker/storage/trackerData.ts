import { setStoredItem } from "@account/sync/syncMeta"
import { keepUnchanged } from "@common/keepUnchanged"
import {
    entriesOf,
    guarded,
    itemsOf,
    parseOrNull,
    validEntries,
    validItems,
    wholeNumber,
} from "@common/schemas"
import { isClassId, type ClassId } from "@config/classPresets/classInfo"
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
import type { ArenaRecord, TrackerData, TrackerTask } from "@tracker/types"
import * as v from "valibot"

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
    corridorHolds: {},
    corridorsLeft: {},
    declined: [],
    notes: {},
    membership: true,
}

export const MAX_CUBE_KEYS = 9999

const taskCap = wholeNumber(1, MAX_TASK_CAP)

const optionalField = <S extends v.GenericSchema<unknown>>(schema: S) => {
    return v.fallback(v.optional(schema), undefined)
}

// Saves from before servers existed get the default server.
const CharacterSchema = v.object({
    id: v.string(),
    name: v.string(),
    classId: guarded((value): value is ClassId => {
        return typeof value === "string" && isClassId(value)
    }),
    server: v.fallback(guarded(isServerId), DEFAULT_SERVER_ID),
})

// Saves from before shared tasks existed are per character.
const TaskSchema = v.pipe(
    v.object({
        id: v.string(),
        name: v.string(),
        subtitle: optionalField(v.pipe(v.string(), v.minLength(1))),
        reset: guarded(isTrackerReset),
        cap: taskCap,
        shared: v.fallback(v.boolean(), false),
        recharge: optionalField(taskCap),
        bonusCap: optionalField(wholeNumber(0)),
    }),
    v.transform(({ subtitle, recharge, bonusCap, ...rest }) => {
        const task: TrackerTask = rest

        if (subtitle !== undefined) {
            task.subtitle = subtitle
        }

        if (recharge !== undefined) {
            task.recharge = recharge
            task.bonusCap = bonusCap ?? 0

            return task
        }

        // The task dialogs can't set entries, so an own copy saved before a
        // starter task counted entries takes them from the starter task.
        const starter = STARTER_TASKS.find((item) => item.id === task.id)

        if (starter?.recharge !== undefined) {
            task.recharge = starter.recharge
            task.bonusCap = starter.bonusCap ?? 0
        }

        return task
    }),
)

const TaskCountSchema = v.object({
    period: v.pipe(v.number(), v.integer()),
    count: wholeNumber(0),
})

const TaskEntriesSchema = v.object({
    period: v.pipe(v.number(), v.integer()),
    base: wholeNumber(0),
    bonus: wholeNumber(0),
})

const ArenaSightingSchema = v.object({
    period: wholeNumber(0),
    at: wholeNumber(0),
    modes: entriesOf(v.strictTuple([wholeNumber(0), wholeNumber(0)])),
})

// Arena task starts set by hand in one week.
const ArenaStartsSchema = v.object({
    period: wholeNumber(0),
    starts: validEntries(wholeNumber(0)),
})

const ArenaRecordSchema = v.pipe(
    v.object({
        seen: ArenaSightingSchema,
        base: optionalField(ArenaSightingSchema),
        fixed: optionalField(ArenaStartsSchema),
    }),
    v.transform(({ seen, base, fixed }): ArenaRecord => {
        return {
            seen: seen,
            ...(base && { base: base }),
            ...(fixed && { fixed: fixed }),
        }
    }),
)

const CorridorRecordSchema = v.object({
    period: wholeNumber(0),
    at: wholeNumber(0),
    artifacts: itemsOf(v.string()),
})

// Empty notes are dropped, overlong ones cut.
const NoteSchema = v.pipe(
    v.object({
        short: v.fallback(v.string(), ""),
        long: v.fallback(v.string(), ""),
    }),
    v.transform((note) => {
        return {
            short: note.short.slice(0, MAX_SHORT_NOTE),
            long: note.long.slice(0, MAX_LONG_NOTE),
        }
    }),
    v.check((note) => {
        return note.short.trim() !== "" || note.long.trim() !== ""
    }),
)

// Keeps the first of each id.
const uniqueById = <T extends { id: string }>(items: T[]) => {
    const seen = new Set<string>()

    return items.filter((item) => {
        const isNew = !seen.has(item.id)

        seen.add(item.id)

        return isNew
    })
}

// Per owner, then per task.
const perOwner = <S extends v.GenericSchema<unknown>>(item: S) => {
    return validEntries(entriesOf(item))
}

const strings = validItems(v.string())

const TrackerDataSchema = v.object({
    characters: v.pipe(validItems(CharacterSchema), v.transform(uniqueById)),
    // Null: the starter tasks, never edited.
    tasks: v.fallback(
        v.nullable(v.pipe(itemsOf(TaskSchema), v.transform(uniqueById))),
        null,
    ),
    // Missing: from before the first presets were tracked.
    presets: optionalField(itemsOf(v.string())),
    counts: perOwner(TaskCountSchema),
    entries: perOwner(TaskEntriesSchema),
    minimized: strings,
    goalsOpen: strings,
    ignored: validEntries(v.pipe(itemsOf(v.string()), v.minLength(1))),
    energy: validEntries(TaskEntriesSchema),
    cubeKeys: validEntries(wholeNumber(0, MAX_CUBE_KEYS)),
    arena: validEntries(ArenaRecordSchema),
    corridorHolds: validEntries(CorridorRecordSchema),
    corridorsLeft: validEntries(CorridorRecordSchema),
    declined: strings,
    notes: validEntries(NoteSchema),
    // Saves from before it existed assume the membership.
    membership: v.fallback(v.boolean(), true),
})

export const parseTrackerData = (value: unknown): TrackerData => {
    const data = parseOrNull(TrackerDataSchema, value)

    if (data === null) {
        return EMPTY_DATA
    }

    const known = data.presets ?? FIRST_PRESETS

    return {
        ...data,
        // The user's own list, with starter tasks it didn't know of yet added.
        tasks:
            data.tasks === null
                ? null
                : [
                      ...addNewPresets(
                          renameOldPresets(data.tasks, known),
                          known,
                      ),
                  ],
        presets: STARTER_IDS,
        // Starter tasks that start ignored do so for the characters already
        // there.
        ignored: addIgnored(
            data.ignored,
            data.characters.map((character) => character.id),
            getNewIgnoredPresets(known),
        ),
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
        // Parts the change left alone keep their identity: only what changed
        // re-renders.
        cached = { raw: raw, data: keepUnchanged(cached?.data, parse(raw)) }
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
    cached = { raw: readRaw(), data: keepUnchanged(cached?.data, data) }

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
