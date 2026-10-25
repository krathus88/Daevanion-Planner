import type { TimerDefinition, TimerId } from "@timers/config/timers"
import type { TimerEntry } from "@timers/hooks/useTimers"

export const COMING_NEXT_COUNT = 4

// Events count by default; bosses and resets only once turned on.
export const isInComingNext = (
    overrides: Partial<Record<TimerId, boolean>>,
    timer: TimerDefinition,
) => {
    return overrides[timer.id] ?? timer.category === "event"
}

const getAt = (entry: TimerEntry) => {
    return "at" in entry.state ? entry.state.at : 0
}

// Open timers first, by when they close, then upcoming ones by when they
// start. Unset and killed timers have no next time, so they're left out.
export const getComingNext = (entries: readonly TimerEntry[]) => {
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

    return [...open, ...upcoming].slice(0, COMING_NEXT_COUNT)
}
