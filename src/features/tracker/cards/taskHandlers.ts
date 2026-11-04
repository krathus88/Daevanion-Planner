import type { EntriesLeft } from "@tracker/logic/taskEntries"
import type { TrackerTask } from "@tracker/types"

// Shared by the cards and their task rows; `owner` is from getTaskOwner.
export type CountChangeHandler = (
    owner: string,
    task: TrackerTask,
    period: number,
    count: number,
) => void

export type EntriesChangeHandler = (
    owner: string,
    task: TrackerTask,
    period: number,
    left: EntriesLeft,
) => void

export type IgnoredChangeHandler = (
    owner: string,
    taskId: string,
    ignored: boolean,
) => void
