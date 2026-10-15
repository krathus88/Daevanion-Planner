import { isRecord } from "@planner/storage/isRecord"
import { formatDuration } from "@timers/logic/formatTime"
import { everyHours, type ServerSchedule } from "@timers/logic/serverSchedule"
import { FIELD_BOSS_LOOT, type BossLoot } from "./fieldBossLoot"
import { FIELD_BOSSES, type FieldBoss, type FieldBossId } from "./fieldBosses"
import {
    DailyReset,
    FieldBoss as FieldBossIcon,
    ShugoFestival,
    SpacetimeRift,
    WeeklyReset,
} from "@assets/timers"

// EU (Elyos) schedules. NCSOFT publishes none of these, so the times are the
// ones the community reports. Resets are in UTC; the rift keeps EU server
// time, so it moves in UTC when the clocks change.
const MINUTE = 60_000
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

// A timer that repeats every `period` from `anchor`, e.g. every 3 hours from
// 00:00 UTC. `openFor` is how long the event stays joinable after it starts.
export type FixedSchedule = {
    anchor: number
    period: number
    openFor: number
}

export type TimerId = FieldBossId | "rift" | "shugo" | "daily" | "weekly"

// Hues a timer can take; Chakra palettes, so every shade is a theme token.
export const TIMER_HUES = [
    "red",
    "orange",
    "yellow",
    "green",
    "teal",
    "cyan",
    "blue",
    "purple",
    "pink",
    "gray",
] as const

type TimerHue = (typeof TIMER_HUES)[number]

// Each hue comes strong (its mid shade) or soft (a pastel of the same hue).
export const TIMER_TONES = ["strong", "soft"] as const

type TimerTone = (typeof TIMER_TONES)[number]

export type TimerColor = {
    hue: TimerHue
    tone: TimerTone
}

export const isTimerColor = (value: unknown): value is TimerColor => {
    return (
        isRecord(value) &&
        TIMER_HUES.some((hue) => hue === value.hue) &&
        TIMER_TONES.some((tone) => tone === value.tone)
    )
}

// The tabs on the Timers page.
export type TimerCategory = "boss" | "event" | "reset"

export const TIMER_CATEGORIES: readonly {
    id: TimerCategory
    label: string
}[] = [
    { id: "boss", label: "Field bosses" },
    { id: "event", label: "Events" },
    { id: "reset", label: "Resets" },
]

export const isTimerCategory = (value: unknown): value is TimerCategory => {
    return TIMER_CATEGORIES.some((category) => category.id === value)
}

export type TimerDefinition = {
    id: TimerId
    category: TimerCategory
    name: string
    // Used where space is tight, e.g. the pinned timers in the header.
    shortName: string
    description: string
    icon?: string
    // Defaults the user can change on the Timers page.
    color: TimerColor
    // How many minutes before it starts the timer counts as "soon".
    soonMinutes: number
    // Missing for field bosses, whose spawns come from the user or their own
    // schedule.
    schedule?: FixedSchedule | ServerSchedule
    boss?: FieldBoss
    loot?: BossLoot
}

// Wednesday 14 October 2026, 07:00 UTC: a daily and weekly reset.
const RESET_ANCHOR = Date.UTC(2026, 9, 14, 7)

export const WEEKLY_RESET: FixedSchedule = {
    anchor: RESET_ANCHOR,
    period: 7 * DAY,
    openFor: 0,
}

const EVENT_TIMERS: readonly TimerDefinition[] = [
    {
        id: "rift",
        category: "event",
        name: "Spacetime Rift",
        shortName: "Rift",
        icon: SpacetimeRift,
        color: { hue: "purple", tone: "strong" },
        soonMinutes: 15,
        description:
            "Every 3 hours from 02:00 EU server time (CET/CEST). The portal stays open for about 10 minutes.",
        schedule: { times: everyHours(3, 2), openFor: 10 * MINUTE },
    },
    {
        id: "shugo",
        category: "event",
        name: "Shugo Festival",
        shortName: "Shugo",
        icon: ShugoFestival,
        color: { hue: "green", tone: "strong" },
        soonMinutes: 5,
        description:
            "Every hour on the hour. The lobby is open for about 3 minutes.",
        schedule: {
            anchor: Date.UTC(2026, 9, 14, 0),
            period: HOUR,
            openFor: 3 * MINUTE,
        },
    },
    {
        id: "daily",
        category: "reset",
        name: "Daily reset",
        shortName: "Daily",
        icon: DailyReset,
        color: { hue: "blue", tone: "strong" },
        soonMinutes: 30,
        description: "Every day at 07:00 UTC.",
        schedule: { anchor: RESET_ANCHOR, period: DAY, openFor: 0 },
    },
    {
        id: "weekly",
        category: "reset",
        name: "Weekly reset",
        shortName: "Weekly",
        icon: WeeklyReset,
        color: { hue: "yellow", tone: "strong" },
        soonMinutes: 60,
        description: "Every Wednesday at 07:00 UTC.",
        schedule: WEEKLY_RESET,
    },
]

const toBossTimer = (boss: (typeof FIELD_BOSSES)[number]): TimerDefinition => {
    // Long respawns get an earlier heads-up.
    const isLong = boss.respawn === null || boss.respawn >= 6 * HOUR

    return {
        id: boss.id,
        category: "boss",
        name: boss.name,
        shortName: boss.shortName,
        icon: FieldBossIcon,
        color: { hue: "red", tone: "strong" },
        soonMinutes: isLong ? 15 : 5,
        description:
            boss.respawn === null
                ? `Spawns: ${boss.note} (EU server time).`
                : `Respawns ${formatDuration(boss.respawn)} after it dies.`,
        boss: boss,
        loot: FIELD_BOSS_LOOT[boss.id],
    }
}

export const TIMERS: readonly TimerDefinition[] = [
    ...FIELD_BOSSES.map(toBossTimer),
    ...EVENT_TIMERS,
]

export const isTimerId = (value: unknown): value is TimerId => {
    return TIMERS.some((timer) => timer.id === value)
}

// Players kill a field boss about a minute after it spawns, so a boss that
// respawns N after dying spawns again every N plus a minute.
export const BOSS_ALIVE_FOR = MINUTE
