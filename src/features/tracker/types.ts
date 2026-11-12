import type { ClassId } from "@config/classPresets/classInfo"

// "once" never resets: one-off goals, like a source's lifetime cap.
export type TrackerReset = "daily" | "weekly" | "siege" | "once"

export type TimedReset = Exclude<TrackerReset, "once">

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

// Lifetime arena record per mode (the game's mode numbers): [wins, losses].
export type ArenaModes = Record<string, [number, number]>

// An arena record as seen in one weekly reset period, and when (ms).
export type ArenaSighting = {
    period: number
    at: number
    modes: ArenaModes
}

// What the companion has seen of a character's arena record: the last
// sighting, and this week's starting record once known (see arenaWeeks).
export type ArenaRecord = {
    seen: ArenaSighting
    base?: ArenaSighting
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
    // Owners whose One-off box is open (it starts closed).
    goalsOpen: string[]
    // Task ids each owner skips for good: still shown, dimmed, and left out
    // of the progress.
    ignored: Record<string, string[]>
    // Odyle Energy by character id (not a task: it sits on the card itself).
    energy: Record<string, TaskEntries>
    // Hidden Cube keys in each character's inventory, by character id
    // (missing: never set). Like energy, it sits on the card.
    cubeKeys: Record<string, number>
    // Arena records by character id, filled by the companion app: the game
    // sends lifetime wins per mode, so each week's start is kept to count it.
    arena: Record<string, ArenaRecord>
    // Characters the companion app sent that the user chose not to add, as
    // "<server id>:<name in lower case>": not asked about again.
    declined: string[]
    // A note per character id: the short one shows on the card, the long one
    // (or the short) on the note button's hover. Characters without one are left out.
    notes: Record<string, CharacterNote>
    // The account's Special Quai Membership: raises the Odyle Energy cap.
    membership: boolean
}
