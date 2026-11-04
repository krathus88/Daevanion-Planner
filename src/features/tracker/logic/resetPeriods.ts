import { getResetSchedule } from "@tracker/config/trackerResets"
import type { TaskCount, TrackerReset } from "@tracker/types"

// Which reset period `now` falls in: counts saved in an older period read
// as 0, so a reset needs no write.
const getResetPeriod = (reset: TrackerReset, now: number) => {
    const schedule = getResetSchedule(reset)

    return Math.floor((now - schedule.anchor) / schedule.period)
}

export type ResetPeriods = Record<TrackerReset, number>

export const getResetPeriods = (now: number): ResetPeriods => {
    return {
        daily: getResetPeriod("daily", now),
        weekly: getResetPeriod("weekly", now),
    }
}

export const getNextReset = (reset: TrackerReset, now: number) => {
    const schedule = getResetSchedule(reset)

    return schedule.anchor + (getResetPeriod(reset, now) + 1) * schedule.period
}

export const readCount = (count: TaskCount | undefined, period: number) => {
    return count && count.period === period ? count.count : 0
}
