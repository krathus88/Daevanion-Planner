import type { TimerDefinition, TimerId } from "@timers/config/timers"
import type { TimerEntry } from "@timers/hooks/useTimers"

export const MIN_COMING_NEXT_COUNT = 1
export const MAX_COMING_NEXT_COUNT = 8
export const DEFAULT_COMING_NEXT_COUNT = 4

export const isComingNextCount = (value: unknown): value is number => {
    return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= MIN_COMING_NEXT_COUNT &&
        value <= MAX_COMING_NEXT_COUNT
    )
}

// Field bosses that count by default, on top of the Abyss ones.
const DEFAULT_BOSSES: readonly TimerId[] = ["gartua", "immortal-gartua"]

// Events, resets, Abyss bosses and DEFAULT_BOSSES count unless turned off.
const isDefaultInComingNext = (timer: TimerDefinition) => {
    if (!timer.boss) {
        return true
    }

    return timer.boss.region === "abyss" || DEFAULT_BOSSES.includes(timer.id)
}

export const isInComingNext = (
    overrides: Partial<Record<TimerId, boolean>>,
    timer: TimerDefinition,
) => {
    return overrides[timer.id] ?? isDefaultInComingNext(timer)
}

const getAt = (entry: TimerEntry) => {
    return "at" in entry.state ? entry.state.at : 0
}

// Open timers first, by when they close, then upcoming ones by when they
// start. Unset and killed timers have no next time, so they're left out.
export const getComingNext = (
    entries: readonly TimerEntry[],
    count: number,
) => {
    const open: TimerEntry[] = []
    const upcoming: TimerEntry[] = []

    for (const entry of entries) {
        if (!entry.inComingNext) {
            continue
        }

        if (entry.state.status === "open") {
            open.push(entry)
        } else if (entry.state.status === "upcoming") {
            upcoming.push(entry)
        }
    }

    const byTime = (a: TimerEntry, b: TimerEntry) => {
        return getAt(a) - getAt(b)
    }

    open.sort(byTime)
    upcoming.sort(byTime)

    return [...open, ...upcoming].slice(0, count)
}
