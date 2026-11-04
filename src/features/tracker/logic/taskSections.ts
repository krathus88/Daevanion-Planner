import { TRACKER_RESETS } from "@tracker/config/trackerResets"
import type { TrackerReset, TrackerTask } from "@tracker/types"

export type TaskSection = {
    reset: TrackerReset
    label: string
    // Per character, then the ones shared by each server.
    tasks: TrackerTask[]
    sharedTasks: TrackerTask[]
}

// One section per reset that has tasks, in TRACKER_RESETS order.
export const getTaskSections = (tasks: readonly TrackerTask[]) => {
    const sections: TaskSection[] = []

    for (const reset of TRACKER_RESETS) {
        const ownTasks: TrackerTask[] = []
        const sharedTasks: TrackerTask[] = []

        for (const task of tasks) {
            if (task.reset !== reset.id) {
                continue
            }

            if (task.shared) {
                sharedTasks.push(task)
            } else {
                ownTasks.push(task)
            }
        }

        if (ownTasks.length > 0 || sharedTasks.length > 0) {
            sections.push({
                reset: reset.id,
                label: reset.label,
                tasks: ownTasks,
                sharedTasks: sharedTasks,
            })
        }
    }

    return sections
}
