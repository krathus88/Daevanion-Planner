import { ARENA_TASKS } from "@account/game/gameIds"
import { STARTER_TASKS, STARTS_IGNORED } from "@tracker/config/starterTasks"
import {
    MAX_CUBE_KEYS,
    MAX_LONG_NOTE,
    MAX_SHORT_NOTE,
    MAX_TASK_CAP,
} from "@tracker/storage/trackerData"
import type {
    CharacterNote,
    TrackerCharacter,
    TrackerData,
    TrackerReset,
    TrackerTask,
} from "@tracker/types"
import {
    isArenaWeekUnknown,
    startFromCounts,
    type ArenaTotals,
} from "./arenaWeeks"
import { addIgnored, insertPreset } from "./presetTasks"
import { clampEnergy, getEnergyCap, type EnergyLeft } from "./odyleEnergy"
import { readCount } from "./resetPeriods"
import { clampEntries, type EntriesLeft } from "./taskEntries"

export type TaskFields = {
    name: string
    subtitle?: string
    reset: TrackerReset
    cap: number
    shared: boolean
}

export type CharacterFields = Omit<TrackerCharacter, "id">

export const getTasks = (data: TrackerData) => {
    return data.tasks ?? STARTER_TASKS
}

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, value))
}

// Moves an item to where `targetId` is, shifting those between; an unknown
// id leaves the list as is.
const moveItem = <T extends { id: string }>(
    items: readonly T[],
    id: string,
    targetId: string,
) => {
    const from = items.findIndex((item) => item.id === id)
    const to = items.findIndex((item) => item.id === targetId)

    if (from === -1 || to === -1) {
        return [...items]
    }

    const moved = [...items]
    const [item] = moved.splice(from, 1)

    moved.splice(to, 0, item)

    return moved
}

// Everything but the removed owner's and the removed task's.
const dropPerOwner = <T>(
    perOwner: Record<string, Record<string, T>>,
    owner: string | null,
    taskId: string | null,
) => {
    const kept: Record<string, Record<string, T>> = {}

    for (const [current, perTask] of Object.entries(perOwner)) {
        if (current === owner) {
            continue
        }

        const keptTasks = { ...perTask }

        if (taskId !== null) {
            delete keptTasks[taskId]
        }

        kept[current] = keptTasks
    }

    return kept
}

// Every owner's ignored tasks but the removed owner's and the removed task.
const dropIgnored = (
    ignored: TrackerData["ignored"],
    owner: string | null,
    taskId: string | null,
) => {
    const kept: TrackerData["ignored"] = {}

    for (const [current, taskIds] of Object.entries(ignored)) {
        const keptIds = taskIds.filter((id) => id !== taskId)

        if (current !== owner && keptIds.length > 0) {
            kept[current] = keptIds
        }
    }

    return kept
}

export const setIgnored = (
    data: TrackerData,
    owner: string,
    taskId: string,
    ignored: boolean,
): TrackerData => {
    const others = (data.ignored[owner] ?? []).filter((id) => id !== taskId)
    const next = ignored ? [...others, taskId] : others
    const rest = dropIgnored(data.ignored, owner, null)

    return {
        ...data,
        ignored: next.length > 0 ? { ...rest, [owner]: next } : rest,
    }
}

export const setCount = (
    data: TrackerData,
    owner: string,
    task: TrackerTask,
    period: number,
    count: number,
): TrackerData => {
    return {
        ...data,
        counts: {
            ...data.counts,
            [owner]: {
                ...data.counts[owner],
                [task.id]: {
                    period: period,
                    count: clamp(Math.round(count), 0, task.cap),
                },
            },
        },
    }
}

export const setEntries = (
    data: TrackerData,
    owner: string,
    task: TrackerTask,
    period: number,
    left: EntriesLeft,
): TrackerData => {
    return {
        ...data,
        entries: {
            ...data.entries,
            [owner]: {
                ...data.entries[owner],
                [task.id]: { period: period, ...clampEntries(task, left) },
            },
        },
    }
}

export const addCharacter = (
    data: TrackerData,
    fields: CharacterFields,
): TrackerData => {
    const character: TrackerCharacter = {
        id: crypto.randomUUID(),
        ...fields,
        name: fields.name.trim(),
    }

    // Starter tasks that start ignored, if the list still has them.
    const taskIds = new Set(getTasks(data).map((task) => task.id))
    const startIgnored = STARTS_IGNORED.filter((id) => taskIds.has(id))

    return {
        ...data,
        characters: [...data.characters, character],
        ignored: addIgnored(data.ignored, [character.id], startIgnored),
    }
}

export const updateCharacter = (
    data: TrackerData,
    id: string,
    changes: Partial<CharacterFields>,
): TrackerData => {
    return {
        ...data,
        characters: data.characters.map((character) => {
            return character.id === id
                ? { ...character, ...changes }
                : character
        }),
    }
}

// A server's shared counts stay: other characters may be on it, or come back.
export const removeCharacter = (data: TrackerData, id: string): TrackerData => {
    return {
        ...data,
        characters: data.characters.filter((character) => character.id !== id),
        counts: dropPerOwner(data.counts, id, null),
        entries: dropPerOwner(data.entries, id, null),
        ignored: dropIgnored(data.ignored, id, null),
        minimized: data.minimized.filter((owner) => owner !== id),
        goalsOpen: data.goalsOpen.filter((owner) => owner !== id),
        energy: dropKey(data.energy, id),
        cubeKeys: dropKey(data.cubeKeys, id),
        arena: dropKey(data.arena, id),
        corridorsLeft: dropKey(data.corridorsLeft, id),
        notes: dropKey(data.notes, id),
    }
}

const dropKey = <T>(record: Record<string, T>, key: string) => {
    const next = { ...record }

    delete next[key]

    return next
}

export const moveCharacter = (
    data: TrackerData,
    id: string,
    targetId: string,
): TrackerData => {
    return { ...data, characters: moveItem(data.characters, id, targetId) }
}

// Names aren't trimmed here: edits save on every keystroke, so a trailing
// space is the user still typing. Entry settings stay as they were; an
// emptied subtitle is dropped.
const toTask = (
    id: string,
    fields: TaskFields,
    previous?: TrackerTask,
): TrackerTask => {
    const task: TrackerTask = {
        ...previous,
        id: id,
        name: fields.name,
        reset: fields.reset,
        cap: clamp(Math.round(fields.cap), 1, MAX_TASK_CAP),
        shared: fields.shared,
    }

    if (fields.subtitle) {
        task.subtitle = fields.subtitle
    } else {
        delete task.subtitle
    }

    return task
}

export const addTask = (data: TrackerData, fields: TaskFields): TrackerData => {
    return {
        ...data,
        tasks: [
            ...getTasks(data),
            toTask(crypto.randomUUID(), {
                ...fields,
                name: fields.name.trim(),
            }),
        ],
    }
}

export const updateTask = (
    data: TrackerData,
    id: string,
    fields: TaskFields,
): TrackerData => {
    return {
        ...data,
        tasks: getTasks(data).map((task) => {
            return task.id === id ? toTask(id, fields, task) : task
        }),
    }
}

export const removeTask = (data: TrackerData, id: string): TrackerData => {
    return {
        ...data,
        tasks: getTasks(data).filter((task) => task.id !== id),
        counts: dropPerOwner(data.counts, null, id),
        entries: dropPerOwner(data.entries, null, id),
        ignored: dropIgnored(data.ignored, null, id),
    }
}

const isSameGroup = (a: TrackerTask, b: TrackerTask) => {
    return a.reset === b.reset && a.shared === b.shared
}

// Tasks show grouped by reset, then shared or not, so a task only moves to
// where another of its own group is.
export const moveTask = (
    data: TrackerData,
    id: string,
    targetId: string,
): TrackerData => {
    const tasks = getTasks(data)
    const moved = tasks.find((task) => task.id === id)
    const target = tasks.find((task) => task.id === targetId)

    if (!moved || !target || moved === target || !isSameGroup(moved, target)) {
        return data
    }

    return { ...data, tasks: moveItem(tasks, id, targetId) }
}

// Starter tasks the user removed from their own list, in starter order, so
// they can be added back.
export const getRemovedPresets = (data: TrackerData) => {
    if (!data.tasks) {
        return []
    }

    const ids = new Set(data.tasks.map((task) => task.id))

    return STARTER_TASKS.filter((task) => !ids.has(task.id))
}

// Adds a removed starter task back, before the next starter task still in the
// list (or last).
export const restorePreset = (data: TrackerData, id: string): TrackerData => {
    const tasks = getTasks(data)
    const preset = STARTER_TASKS.find((task) => task.id === id)
    const next = preset ? insertPreset(tasks, preset) : tasks

    return next === tasks ? data : { ...data, tasks: [...next] }
}

// Back to the starter list; counts of the user's own tasks stay unread.
export const restoreStarterTasks = (data: TrackerData): TrackerData => {
    return { ...data, tasks: null }
}

// A character's Odyle Energy as of `period`, kept within the account's cap.
export const setEnergy = (
    data: TrackerData,
    characterId: string,
    period: number,
    left: EnergyLeft,
): TrackerData => {
    return {
        ...data,
        energy: {
            ...data.energy,
            [characterId]: {
                period: period,
                ...clampEnergy(left, getEnergyCap(data.membership)),
            },
        },
    }
}

// A character's Hidden Cube keys, kept to whole numbers within the cap.
export const setCubeKeys = (
    data: TrackerData,
    characterId: string,
    count: number,
): TrackerData => {
    return {
        ...data,
        cubeKeys: {
            ...data.cubeKeys,
            [characterId]: Math.min(
                MAX_CUBE_KEYS,
                Math.max(0, Math.round(count)),
            ),
        },
    }
}

// Saves a character's note, trimmed; an empty one removes it.
export const setNote = (
    data: TrackerData,
    characterId: string,
    note: CharacterNote,
): TrackerData => {
    const short = note.short.trim().slice(0, MAX_SHORT_NOTE)
    const long = note.long.trim().slice(0, MAX_LONG_NOTE)

    if (short === "" && long === "") {
        return { ...data, notes: dropKey(data.notes, characterId) }
    }

    return {
        ...data,
        notes: { ...data.notes, [characterId]: { short: short, long: long } },
    }
}

export const setMembership = (
    data: TrackerData,
    membership: boolean,
): TrackerData => {
    return { ...data, membership: membership }
}

// Minimizes or expands the given cards, by owner, leaving the rest as is.
export const setGoalsOpen = (
    data: TrackerData,
    owner: string,
    open: boolean,
): TrackerData => {
    const others = data.goalsOpen.filter((item) => item !== owner)

    return {
        ...data,
        goalsOpen: open ? [...others, owner] : others,
    }
}

export const setMinimized = (
    data: TrackerData,
    owners: readonly string[],
    minimized: boolean,
): TrackerData => {
    const others = data.minimized.filter((owner) => !owners.includes(owner))

    return {
        ...data,
        minimized: minimized ? [...others, ...owners] : others,
    }
}

// A character's arena week the companion couldn't work out, taken from the
// tracker's own counts (entered or confirmed by the user): from then on the
// game fills it again. Nothing changes when the week is known.
export const confirmArenaWeek = (
    data: TrackerData,
    characterId: string,
    period: number,
): TrackerData => {
    const record = data.arena[characterId]

    if (record === undefined || !isArenaWeekUnknown(record, period)) {
        return data
    }

    const counts: Record<string, ArenaTotals> = {}

    for (const [taskId, source] of Object.entries(ARENA_TASKS)) {
        const count = readCount(data.counts[characterId]?.[taskId], period)
        const mode = (counts[source.mode] ??= { played: 0, won: 0 })

        mode[source.counts] = count
    }

    return {
        ...data,
        arena: {
            ...data.arena,
            [characterId]: startFromCounts(record, counts),
        },
    }
}

// How a character the companion app sent is named in `declined`.
const getDeclineKey = (server: string, name: string) => {
    return `${server}:${name.trim().toLowerCase()}`
}

// The user chose not to add a character the companion app sent.
export const declineGameCharacter = (
    data: TrackerData,
    server: string,
    name: string,
): TrackerData => {
    const key = getDeclineKey(server, name)

    return data.declined.includes(key)
        ? data
        : { ...data, declined: [...data.declined, key] }
}
