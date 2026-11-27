import { STARTER_TASKS, STARTS_IGNORED } from "@tracker/config/starterTasks"
import type { TrackerData, TrackerTask } from "@tracker/types"

export const STARTER_IDS = STARTER_TASKS.map((task) => task.id)

// Adds a starter task before the next starter task still in the list (or
// last); a task already there leaves the list as is.
export const insertPreset = (
    tasks: readonly TrackerTask[],
    preset: TrackerTask,
) => {
    const index = STARTER_TASKS.findIndex((task) => task.id === preset.id)

    if (index === -1 || tasks.some((task) => task.id === preset.id)) {
        return tasks
    }

    const laterIds = new Set(STARTER_IDS.slice(index + 1))
    const at = tasks.findIndex((task) => laterIds.has(task.id))
    const next = [...tasks]

    next.splice(at === -1 ? next.length : at, 0, { ...preset })

    return next
}

// Starter tasks that came out after the user's own list was saved join it;
// ones the list already knew stay removed if the user removed them.
export const addNewPresets = (
    tasks: readonly TrackerTask[],
    knownIds: readonly string[],
) => {
    const known = new Set(knownIds)
    let next = tasks

    for (const preset of STARTER_TASKS) {
        if (!known.has(preset.id)) {
            next = insertPreset(next, preset)
        }
    }

    return next
}

// Each owner's ignored tasks with `taskIds` added, without repeats.
export const addIgnored = (
    ignored: TrackerData["ignored"],
    owners: readonly string[],
    taskIds: readonly string[],
) => {
    if (taskIds.length === 0) {
        return ignored
    }

    const next = { ...ignored }

    for (const owner of owners) {
        const current = next[owner] ?? []
        const added = taskIds.filter((id) => !current.includes(id))

        if (added.length > 0) {
            next[owner] = [...current, ...added]
        }
    }

    return next
}

// Starter tasks that start ignored and the save didn't know of yet.
export const getNewIgnoredPresets = (knownIds: readonly string[]) => {
    return STARTS_IGNORED.filter((id) => !knownIds.includes(id))
}

const ARENA_5V5_IDS = ["arena-wins", "arena-participation"]

// Saves from before Arena 1v1 call the 5v5 tasks just "Arena"; ones the user
// renamed keep their name.
export const renameOldPresets = (
    tasks: readonly TrackerTask[],
    knownIds: readonly string[],
) => {
    if (knownIds.includes("arena-1v1-wins")) {
        return tasks
    }

    return tasks.map((task) => {
        return ARENA_5V5_IDS.includes(task.id) && task.name === "Arena"
            ? { ...task, name: "Arena 5v5" }
            : task
    })
}

// Starter caps that went up after release: task id → [old cap, new cap]. A
// saved copy still at the old cap takes the new one (one the user changed
// keeps theirs). The Nightmare and Shugo Festival shards went 35 → 50
// (2026-11-27). Not tied to the save's known presets: saves that already knew
// the newer tasks kept the old caps.
const RAISED_CAPS: Record<string, [number, number]> = {
    "shards-nightmare": [35, 50],
    "shards-shugo": [35, 50],
}

export const raiseOldCaps = (tasks: readonly TrackerTask[]) => {
    return tasks.map((task) => {
        const raised = RAISED_CAPS[task.id]

        return raised !== undefined && task.cap === raised[0]
            ? { ...task, cap: raised[1] }
            : task
    })
}
