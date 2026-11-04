import { DailyReset, WeeklyReset } from "@assets/timers"
import {
    DAILY_RESET,
    WEEKLY_RESET,
    type FixedSchedule,
} from "@timers/config/timers"
import type { TrackerReset } from "@tracker/types"

// Same icons as the Timers page's reset timers.
export const TRACKER_RESETS: readonly {
    id: TrackerReset
    label: string
    icon: string
    schedule: FixedSchedule
}[] = [
    { id: "daily", label: "Daily", icon: DailyReset, schedule: DAILY_RESET },
    {
        id: "weekly",
        label: "Weekly",
        icon: WeeklyReset,
        schedule: WEEKLY_RESET,
    },
]

export const isTrackerReset = (value: unknown): value is TrackerReset => {
    return TRACKER_RESETS.some((reset) => reset.id === value)
}

export const getResetSchedule = (reset: TrackerReset) => {
    return reset === "daily" ? DAILY_RESET : WEEKLY_RESET
}
