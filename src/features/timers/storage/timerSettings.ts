import { setStoredItem } from "@account/sync/syncMeta"
import { keepUnchanged } from "@common/keepUnchanged"
import {
    finiteNumber,
    guarded,
    parseStored,
    validEntries,
    wholeNumber,
} from "@common/schemas"
import {
    isTimerColor,
    isTimerId,
    type TimerColor,
    type TimerId,
} from "@timers/config/timers"
import {
    DEFAULT_COMING_NEXT_COUNT,
    isComingNextCount,
} from "@timers/logic/comingNext"
import {
    isComingNextPosition,
    type ComingNextPosition,
} from "@timers/logic/comingNextPosition"
import { MAX_PER_COLUMN, type PinnedColumns } from "@timers/logic/pinnedColumns"
import { DEFAULT_SERVER_ID, isServerId } from "@timers/config/servers"
import * as v from "valibot"

export type BossReport =
    { spawnAt: number; reportedAt: number } | { killedAt: number }

export type TimerSettings = {
    pinned: PinnedColumns
    showPinned: boolean
    bossReports: Partial<Record<TimerId, BossReport>>
    colors: Partial<Record<TimerId, TimerColor>>
    soonMinutes: Partial<Record<TimerId, number>>
    // Overrides only; see isInComingNext for the defaults.
    comingNext: Partial<Record<TimerId, boolean>>
    showComingNext: boolean
    comingNextCount: number
    // Null hangs it from the header at the content's left edge.
    comingNextPosition: ComingNextPosition | null
    server: string
    // Off keeps every boss report on this device only.
    showShared: boolean
}

const KEY = "daevanion:timers:v1:settings"
const CHANGE_EVENT = "daevanion-timers-change"

const DEFAULT_SETTINGS: TimerSettings = {
    pinned: [
        ["weekly", "daily"],
        ["rift", "shugo"],
        ["invasion", "siege"],
        // Only the selected server's faction shows.
        ["gartua", "immortal-gartua"],
    ],
    showPinned: true,
    bossReports: {},
    colors: {},
    soonMinutes: {},
    comingNext: {},
    showComingNext: false,
    comingNextCount: DEFAULT_COMING_NEXT_COUNT,
    comingNextPosition: null,
    server: DEFAULT_SERVER_ID,
    showShared: true,
}

const SpawnReportSchema = v.object({
    spawnAt: finiteNumber,
    reportedAt: finiteNumber,
})

const BossReportSchema = v.union([
    SpawnReportSchema,
    v.object({ killedAt: finiteNumber }),
])

// Columns of 1 to MAX_PER_COLUMN timers, each timer pinned once.
const PinnedColumnsSchema = v.pipe(
    v.array(
        v.pipe(
            v.array(guarded(isTimerId)),
            v.minLength(1),
            v.maxLength(MAX_PER_COLUMN),
        ),
    ),
    v.check((columns) => {
        const ids = columns.flat()

        return new Set(ids).size === ids.length
    }),
)

const perTimer = <S extends v.GenericSchema<unknown>>(item: S) => {
    return validEntries(item, isTimerId)
}

const SettingsSchema = v.object({
    pinned: v.fallback(PinnedColumnsSchema, DEFAULT_SETTINGS.pinned),
    showPinned: v.fallback(v.boolean(), DEFAULT_SETTINGS.showPinned),
    bossReports: perTimer(BossReportSchema),
    colors: perTimer(guarded(isTimerColor)),
    soonMinutes: perTimer(wholeNumber(0)),
    comingNext: perTimer(v.boolean()),
    showComingNext: v.fallback(v.boolean(), DEFAULT_SETTINGS.showComingNext),
    comingNextCount: v.fallback(
        guarded(isComingNextCount),
        DEFAULT_SETTINGS.comingNextCount,
    ),
    comingNextPosition: v.fallback(
        v.nullable(guarded(isComingNextPosition)),
        DEFAULT_SETTINGS.comingNextPosition,
    ),
    server: v.fallback(guarded(isServerId), DEFAULT_SETTINGS.server),
    showShared: v.fallback(v.boolean(), DEFAULT_SETTINGS.showShared),
})

// Before other bosses, Gartua's report had a field of its own.
const StoredSettingsSchema = v.pipe(
    v.record(v.string(), v.unknown()),
    v.transform((value) => {
        return v.is(SpawnReportSchema, value.gartua)
            ? { ...value, bossReports: { gartua: value.gartua } }
            : value
    }),
    SettingsSchema,
)

const parse = (raw: string | null): TimerSettings => {
    return parseStored(StoredSettingsSchema, raw, DEFAULT_SETTINGS)
}

// useSyncExternalStore needs the same object back until the data changes.
let cached: { raw: string | null; settings: TimerSettings } | null = null

const readRaw = () => {
    try {
        return window.localStorage.getItem(KEY)
    } catch {
        // Storage is blocked; fall back to the defaults.
        return null
    }
}

export const readTimerSettings = () => {
    const raw = readRaw()

    if (!cached || cached.raw !== raw) {
        // Parts the change left alone keep their identity: only what changed
        // re-renders.
        cached = {
            raw: raw,
            settings: keepUnchanged(cached?.settings, parse(raw)),
        }
    }

    return cached.settings
}

export const writeTimerSettings = (settings: TimerSettings) => {
    try {
        setStoredItem(KEY, JSON.stringify(settings))
    } catch {
        // Nothing to do: the change only lasts until the page reloads.
        cached = { raw: readRaw(), settings: settings }
    }

    window.dispatchEvent(new Event(CHANGE_EVENT))
}

export const subscribeToTimerSettings = (onChange: () => void) => {
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === null || event.key === KEY) {
            onChange()
        }
    }

    window.addEventListener(CHANGE_EVENT, onChange)
    window.addEventListener("storage", handleStorageChange)

    return () => {
        window.removeEventListener(CHANGE_EVENT, onChange)
        window.removeEventListener("storage", handleStorageChange)
    }
}
