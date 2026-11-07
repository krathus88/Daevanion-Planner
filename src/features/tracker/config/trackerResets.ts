import { ArtifactSiege, DailyReset, WeeklyReset } from "@assets/timers"
import {
    ARTIFACT_SIEGE,
    DAILY_RESET,
    WEEKLY_RESET,
    type FixedSchedule,
} from "@timers/config/timers"
import type { ServerSchedule } from "@timers/logic/serverSchedule"
import type { TrackerReset } from "@tracker/types"

// Same icons and schedules as the Timers page's timers. The siege reset
// comes with each Artifact Siege (the Abyss), at its listed start.
export const TRACKER_RESETS: readonly {
    id: TrackerReset
    label: string
    icon: string
    schedule: FixedSchedule | ServerSchedule
}[] = [
    { id: "daily", label: "Daily", icon: DailyReset, schedule: DAILY_RESET },
    {
        id: "weekly",
        label: "Weekly",
        icon: WeeklyReset,
        schedule: WEEKLY_RESET,
    },
    {
        id: "siege",
        label: "Artifact Siege",
        icon: ArtifactSiege,
        schedule: ARTIFACT_SIEGE,
    },
]

export const isTrackerReset = (value: unknown): value is TrackerReset => {
    return TRACKER_RESETS.some((reset) => reset.id === value)
}

export const getResetSchedule = (reset: TrackerReset) => {
    if (reset === "daily") {
        return DAILY_RESET
    }

    return reset === "weekly" ? WEEKLY_RESET : ARTIFACT_SIEGE
}
