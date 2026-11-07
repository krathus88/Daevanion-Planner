import type { FixedSchedule } from "@timers/config/timers"
import {
    getServerStarts,
    type ServerSchedule,
} from "@timers/logic/serverSchedule"
import { getResetSchedule } from "@tracker/config/trackerResets"
import type { TaskCount, TrackerReset } from "@tracker/types"

const HOUR = 3_600_000
const DAY = 24 * HOUR

const isFixedSchedule = (
    schedule: FixedSchedule | ServerSchedule,
): schedule is FixedSchedule => {
    return "anchor" in schedule
}

// The latest server schedule start at or before `now`, and the one after.
const getServerReset = (schedule: ServerSchedule, now: number) => {
    // A week back always has a start before `now` to walk forward from.
    let last = getServerStarts(schedule, now - 8 * DAY).next
    let next = getServerStarts(schedule, last).next

    while (next <= now) {
        last = next
        next = getServerStarts(schedule, last).next
    }

    return { last: last, next: next }
}

// Which reset period `now` falls in: counts saved in an older period read
// as 0, so a reset needs no write. A server schedule's period is the hour
// of its last start, so it only grows; it isn't a count of resets.
const getResetPeriod = (reset: TrackerReset, now: number) => {
    const schedule = getResetSchedule(reset)

    if (isFixedSchedule(schedule)) {
        return Math.floor((now - schedule.anchor) / schedule.period)
    }

    return Math.round(getServerReset(schedule, now).last / HOUR)
}

export type ResetPeriods = Record<TrackerReset, number>

export const getResetPeriods = (now: number): ResetPeriods => {
    return {
        daily: getResetPeriod("daily", now),
        weekly: getResetPeriod("weekly", now),
        siege: getResetPeriod("siege", now),
    }
}

export const getNextReset = (reset: TrackerReset, now: number) => {
    const schedule = getResetSchedule(reset)

    if (!isFixedSchedule(schedule)) {
        return getServerReset(schedule, now).next
    }

    return schedule.anchor + (getResetPeriod(reset, now) + 1) * schedule.period
}

export const readCount = (count: TaskCount | undefined, period: number) => {
    return count && count.period === period ? count.count : 0
}
