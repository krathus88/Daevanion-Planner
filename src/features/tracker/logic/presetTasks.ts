import { STARTER_TASKS } from "@tracker/config/starterTasks"
import type { TrackerTask } from "@tracker/types"

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
