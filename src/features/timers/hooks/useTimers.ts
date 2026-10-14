import {
    TIMERS,
    type TimerColor,
    type TimerDefinition,
} from "@timers/config/timers"
import { isPinned } from "@timers/logic/pinnedColumns"
import {
    getTimerAlert,
    getTimerState,
    type TimerAlert,
    type TimerState,
} from "@timers/logic/timerState"
import type { BossReport } from "@timers/storage/timerSettings"
import { useNow } from "./useNow"
import { useTimerSettings } from "./useTimerSettings"

export type TimerEntry = {
    timer: TimerDefinition
    state: TimerState
    alert: TimerAlert
    pinned: boolean
    // The user's choice, or the timer's default.
    color: TimerColor
    hasCustomColor: boolean
    soonMinutes: number
    // A field boss's timer or kill, as the user entered it.
    report: BossReport | null
}

// Every timer with its state right now, ticking each second.
export const useTimers = () => {
    const now = useNow()
    const {
        settings,
        togglePinned,
        changePinnedColumns,
        changeTimerColor,
        resetTimerColor,
        changeSoonMinutes,
        changeShowPinned,
        changeBossReport,
    } = useTimerSettings()

    const timers: TimerEntry[] = TIMERS.map((timer) => {
        const report = settings.bossReports[timer.id] ?? null
        const state = getTimerState(timer, report, now)
        const soonMinutes = settings.soonMinutes[timer.id] ?? timer.soonMinutes

        return {
            timer: timer,
            state: state,
            alert: getTimerAlert(state, soonMinutes, now),
            pinned: isPinned(settings.pinned, timer.id),
            color: settings.colors[timer.id] ?? timer.color,
            hasCustomColor: settings.colors[timer.id] !== undefined,
            soonMinutes: soonMinutes,
            report: report,
        }
    })
    const entryById = new Map(timers.map((entry) => [entry.timer.id, entry]))
    // The pinned timers laid out as the header shows them.
    const pinnedColumns = settings.pinned.map((column) =>
        column.flatMap((id) => entryById.get(id) ?? []),
    )

    return {
        now: now,
        timers: timers,
        pinnedColumns: pinnedColumns,
        settings: settings,
        togglePinned: togglePinned,
        changePinnedColumns: changePinnedColumns,
        changeTimerColor: changeTimerColor,
        resetTimerColor: resetTimerColor,
        changeSoonMinutes: changeSoonMinutes,
        changeShowPinned: changeShowPinned,
        changeBossReport: changeBossReport,
    }
}
