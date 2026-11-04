import { STARTER_TASKS } from "@tracker/config/starterTasks"
import { MAX_TASK_CAP } from "@tracker/storage/trackerData"
import type {
    TrackerCharacter,
    TrackerData,
    TrackerReset,
    TrackerTask,
} from "@tracker/types"
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

// Swaps an item with its neighbour; off either end leaves the list as is.
const moveItem = <T extends { id: string }>(
    items: readonly T[],
    id: string,
    offset: -1 | 1,
) => {
    const from = items.findIndex((item) => item.id === id)
    const to = from + offset

    if (from === -1 || to < 0 || to >= items.length) {
        return [...items]
    }

    const moved = [...items]

    moved[from] = items[to]
    moved[to] = items[from]

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

    return { ...data, characters: [...data.characters, character] }
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
    }
}

export const moveCharacter = (
    data: TrackerData,
    id: string,
    offset: -1 | 1,
): TrackerData => {
    return { ...data, characters: moveItem(data.characters, id, offset) }
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

// Tasks show grouped by reset, then shared or not, so a task swaps with the
// next one of its own group, skipping the others.
export const moveTask = (
    data: TrackerData,
    id: string,
    offset: -1 | 1,
): TrackerData => {
    const tasks = [...getTasks(data)]
    const from = tasks.findIndex((task) => task.id === id)

    if (from === -1) {
        return data
    }

    let to = from + offset

    while (
        to >= 0 &&
        to < tasks.length &&
        !isSameGroup(tasks[to], tasks[from])
    ) {
        to += offset
    }

    if (to < 0 || to >= tasks.length) {
        return data
    }

    const moved = tasks[from]

    tasks[from] = tasks[to]
    tasks[to] = moved

    return { ...data, tasks: tasks }
}

// Back to the starter list; counts of the user's own tasks stay unread.
export const restoreStarterTasks = (data: TrackerData): TrackerData => {
    return { ...data, tasks: null }
}

// Minimizes or expands the given cards, by owner, leaving the rest as is.
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
