import { isRecord } from "@planner/storage/isRecord"
import {
    isTimerColor,
    isTimerId,
    type TimerColor,
    type TimerId,
} from "@timers/config/timers"
import { MAX_PER_COLUMN, type PinnedColumns } from "@timers/logic/pinnedColumns"

type SpawnReport = { spawnAt: number; reportedAt: number }

export type BossReport = SpawnReport | { killedAt: number }

export type TimerSettings = {
    pinned: PinnedColumns
    showPinned: boolean
    bossReports: Partial<Record<TimerId, BossReport>>
    colors: Partial<Record<TimerId, TimerColor>>
    soonMinutes: Partial<Record<TimerId, number>>
}

const KEY = "daevanion:timers:v1:settings"
const CHANGE_EVENT = "daevanion-timers-change"

const DEFAULT_SETTINGS: TimerSettings = {
    pinned: [
        ["weekly", "daily"],
        ["rift", "shugo"],
        ["invasion", "siege"],
        ["gartua"],
    ],
    showPinned: true,
    bossReports: {},
    colors: {},
    soonMinutes: {},
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
            showPinned:
                typeof value.showPinned === "boolean"
                    ? value.showPinned
                    : DEFAULT_SETTINGS.showPinned,
            // Before other bosses, Gartua's report had a field of its own.
            bossReports: isSpawnReport(value.gartua)
                ? { gartua: value.gartua }
                : pickPerTimer(value.bossReports, isBossReport),
            colors: pickPerTimer(value.colors, isTimerColor),
            soonMinutes: pickPerTimer(value.soonMinutes, isMinutes),
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
