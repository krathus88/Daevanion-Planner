import type { TrackerTask } from "@tracker/types"

// The name and subtitle on one line, for labels and tooltips.
export const getTaskTitle = (task: TrackerTask) => {
    return task.subtitle ? `${task.name} (${task.subtitle})` : task.name
}
