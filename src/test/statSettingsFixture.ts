import type { StatType } from "@config/stats/stats"
import {
    DEFAULT_STAT_SETTINGS,
    type StatMax,
    type StatSettings,
} from "@planner/storage/statPriorities"

const OFF: StatMax = { enabled: false, skillAfter: null, passiveAfter: null }

// The default settings with Max off for every stat.
export const NOTHING_MAXED: StatSettings = {
    ...DEFAULT_STAT_SETTINGS,
    max: Object.fromEntries(
        Object.keys(DEFAULT_STAT_SETTINGS.max).map((stat) => [stat, OFF]),
    ) as Record<StatType, StatMax>,
}
