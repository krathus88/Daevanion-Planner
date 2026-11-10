import type { EnergyLeft } from "@tracker/logic/odyleEnergy"
import type { EntriesLeft } from "@tracker/logic/taskEntries"
import type { CharacterNote } from "@tracker/types"
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

export type EnergyChangeHandler = (
    characterId: string,
    period: number,
    left: EnergyLeft,
) => void

export type NoteChangeHandler = (
    characterId: string,
    note: CharacterNote,
) => void
