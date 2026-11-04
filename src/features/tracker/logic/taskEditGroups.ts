import type { TaskSection } from "@tracker/logic/taskSections"
import type { TrackerReset, TrackerTask } from "@tracker/types"

export type TaskEditResetList = {
    reset: TrackerReset
    label: string
    tasks: TrackerTask[]
}

export type TaskEditGroup = {
    id: "shared" | "own"
    title: string
    lists: TaskEditResetList[]
}

// The Tasks dialog follows the page: tasks shared by server first, then the
// per character ones, each split by reset. Empty groups and resets are left out.
export const getTaskEditGroups = (sections: readonly TaskSection[]) => {
    const sharedLists: TaskEditResetList[] = []
    const ownLists: TaskEditResetList[] = []

    for (const section of sections) {
        if (section.sharedTasks.length > 0) {
            sharedLists.push({
                reset: section.reset,
                label: section.label,
                tasks: section.sharedTasks,
            })
        }

        if (section.tasks.length > 0) {
            ownLists.push({
                reset: section.reset,
                label: section.label,
                tasks: section.tasks,
            })
        }
    }

    const groups: TaskEditGroup[] = []

    if (sharedLists.length > 0) {
        groups.push({
            id: "shared",
            title: "Shared by server",
            lists: sharedLists,
        })
    }

    if (ownLists.length > 0) {
        groups.push({ id: "own", title: "Per character", lists: ownLists })
    }

    return groups
}
