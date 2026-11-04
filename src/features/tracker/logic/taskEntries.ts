import type { TaskEntries, TrackerTask } from "@tracker/types"

export type EntriesLeft = {
    base: number
    bonus: number
}

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, Math.round(value)))
}

// Entries left in `period`: each reset since the save adds the recharge, up
// to the cap. Never saved means full.
export const readEntries = (
    task: TrackerTask,
    entries: TaskEntries | undefined,
    period: number,
): EntriesLeft => {
    if (!entries) {
        return { base: task.cap, bonus: 0 }
    }

    const resets = Math.max(0, period - entries.period)

    return {
        base: Math.min(task.cap, entries.base + resets * (task.recharge ?? 0)),
        bonus: entries.bonus,
    }
}

export const clampEntries = (
    task: TrackerTask,
    left: EntriesLeft,
): EntriesLeft => {
    return {
        base: clamp(left.base, 0, task.cap),
        bonus: clamp(left.bonus, 0, task.bonusCap ?? 0),
    }
}

// A run uses a recharged entry first, then a bonus ticket.
export const spendEntry = (left: EntriesLeft): EntriesLeft => {
    if (left.base > 0) {
        return { base: left.base - 1, bonus: left.bonus }
    }

    return { base: 0, bonus: Math.max(0, left.bonus - 1) }
}
