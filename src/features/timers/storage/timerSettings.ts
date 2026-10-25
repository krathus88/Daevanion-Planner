import { isRecord } from "@planner/storage/isRecord"
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

type SpawnReport = { spawnAt: number; reportedAt: number }

export type BossReport = SpawnReport | { killedAt: number }

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

const isTime = (value: unknown): value is number => {
    return typeof value === "number" && Number.isFinite(value)
}

const isSpawnReport = (value: unknown): value is SpawnReport => {
    return isRecord(value) && isTime(value.spawnAt) && isTime(value.reportedAt)
}

const isBossReport = (value: unknown): value is BossReport => {
    return isSpawnReport(value) || (isRecord(value) && isTime(value.killedAt))
}

const isPinnedColumns = (value: unknown): value is PinnedColumns => {
    if (!Array.isArray(value)) {
        return false
    }

    const seen = new Set<unknown>()

    for (const column of value) {
        if (
            !Array.isArray(column) ||
            column.length === 0 ||
            column.length > MAX_PER_COLUMN
        ) {
            return false
        }

        for (const id of column) {
            if (!isTimerId(id) || seen.has(id)) {
                return false
            }

            seen.add(id)
        }
    }

    return true
}

const pickPerTimer = <T>(
    value: unknown,
    isValid: (item: unknown) => item is T,
) => {
    const picked: Partial<Record<TimerId, T>> = {}

    if (!isRecord(value)) {
        return picked
    }

    for (const [id, item] of Object.entries(value)) {
        if (isTimerId(id) && isValid(item)) {
            picked[id] = item
        }
    }

    return picked
}

const isMinutes = (value: unknown): value is number => {
    return typeof value === "number" && Number.isInteger(value) && value >= 0
}

const isBoolean = (value: unknown): value is boolean => {
    return typeof value === "boolean"
}

const parse = (raw: string | null): TimerSettings => {
    if (raw === null) {
        return DEFAULT_SETTINGS
    }

    try {
        const value: unknown = JSON.parse(raw)

        if (!isRecord(value)) {
            return DEFAULT_SETTINGS
        }

        return {
            pinned: isPinnedColumns(value.pinned)
                ? value.pinned
                : DEFAULT_SETTINGS.pinned,
            showPinned: isBoolean(value.showPinned)
                ? value.showPinned
                : DEFAULT_SETTINGS.showPinned,
            // Before other bosses, Gartua's report had a field of its own.
            bossReports: isSpawnReport(value.gartua)
                ? { gartua: value.gartua }
                : pickPerTimer(value.bossReports, isBossReport),
            colors: pickPerTimer(value.colors, isTimerColor),
            soonMinutes: pickPerTimer(value.soonMinutes, isMinutes),
            comingNext: pickPerTimer(value.comingNext, isBoolean),
            showComingNext: isBoolean(value.showComingNext)
                ? value.showComingNext
                : DEFAULT_SETTINGS.showComingNext,
            comingNextCount: isComingNextCount(value.comingNextCount)
                ? value.comingNextCount
                : DEFAULT_SETTINGS.comingNextCount,
            comingNextPosition: isComingNextPosition(value.comingNextPosition)
                ? value.comingNextPosition
                : DEFAULT_SETTINGS.comingNextPosition,
            server: isServerId(value.server)
                ? value.server
                : DEFAULT_SETTINGS.server,
            showShared: isBoolean(value.showShared)
                ? value.showShared
                : DEFAULT_SETTINGS.showShared,
        }
    } catch {
        return DEFAULT_SETTINGS
    }
}

// useSyncExternalStore needs the same object back until the data changes.
let cached: { raw: string | null; settings: TimerSettings } | null = null

export const readTimerSettings = () => {
    let raw: string | null = null

    try {
        raw = window.localStorage.getItem(KEY)
    } catch {
        // Storage is blocked; fall back to the defaults.
    }

    if (!cached || cached.raw !== raw) {
        cached = { raw: raw, settings: parse(raw) }
    }

    return cached.settings
}

export const writeTimerSettings = (settings: TimerSettings) => {
    try {
        window.localStorage.setItem(KEY, JSON.stringify(settings))
    } catch {
        // Nothing to do: the change only lasts until the page reloads.
        cached = { raw: null, settings: settings }
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
