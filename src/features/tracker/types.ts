import type { ClassId } from "@config/classPresets/classInfo"

export type TrackerReset = "daily" | "weekly" | "siege"

// Caps up to 6 are boxes to tick, higher ones counters. A shared task has one count
// per server instead of one per character.
//
// With `recharge`, the task counts entries left instead of runs done: each
// reset adds `recharge` entries up to the cap, bonus tickets add up to
// `bonusCap` more, and a run spends the recharged ones first.
export type TrackerTask = {
    id: string
    name: string
    // A second line under the name: which source or kind of the activity.
    subtitle?: string
    reset: TrackerReset
    cap: number
    shared: boolean
    recharge?: number
    bonusCap?: number
}

export type TrackerCharacter = {
    id: string
    name: string
    classId: ClassId
    server: string
}

// A count only holds in the reset period it was made in (see resetPeriods).
export type TaskCount = {
    period: number
    count: number
}

// Entries left as of `period`; later periods add the recharge on read.
export type TaskEntries = {
    period: number
    base: number
    bonus: number
}

export type CharacterNote = {
    short: string
    long: string
}

export type TrackerData = {
    characters: TrackerCharacter[]
    // Null until the user edits the list; the starter list is used instead.
    tasks: TrackerTask[] | null
    // Starter task ids known when the data was saved: newer ones join the
    // user's own list on read. Missing in saves from before it existed.
    presets?: string[]
    // By owner (see taskOwners), then task id.
    counts: Record<string, Record<string, TaskCount>>
    entries: Record<string, Record<string, TaskEntries>>
    // Owners whose card shows only its summary.
    minimized: string[]
    // Task ids each owner skips for good: still shown, dimmed, and left out
    // of the progress.
    ignored: Record<string, string[]>
    // Odyle Energy by character id (not a task: it sits on the card itself).
    energy: Record<string, TaskEntries>
    // A note per character id: the short one shows on the card, the long one
    // (or the short) on the note button's hover. Characters without one are left out.
    notes: Record<string, CharacterNote>
    // The account's Special Quai Membership: raises the Odyle Energy cap.
    membership: boolean
}
