import type { TimerColor, TimerId } from "@timers/config/timers"
import {
    addTimer,
    isPinned,
    removeTimer,
    type PinnedColumns,
} from "@timers/logic/pinnedColumns"
import {
    readTimerSettings,
    subscribeToTimerSettings,
    writeTimerSettings,
    type BossReport,
} from "@timers/storage/timerSettings"
import { useSyncExternalStore } from "react"

export const useTimerSettings = () => {
    const settings = useSyncExternalStore(
        subscribeToTimerSettings,
        readTimerSettings,
    )

    const togglePinned = (id: TimerId) => {
        const current = readTimerSettings()

        writeTimerSettings({
            ...current,
            pinned: isPinned(current.pinned, id)
                ? removeTimer(current.pinned, id)
                : addTimer(current.pinned, id),
        })
    }

    const changePinnedColumns = (pinned: PinnedColumns) => {
        writeTimerSettings({ ...readTimerSettings(), pinned: pinned })
    }

    const changeTimerColor = (id: TimerId, color: TimerColor) => {
        const current = readTimerSettings()

        writeTimerSettings({
            ...current,
            colors: { ...current.colors, [id]: color },
        })
    }

    // Back to the timer's own colour.
    const resetTimerColor = (id: TimerId) => {
        const current = readTimerSettings()
        const colors = { ...current.colors }

        delete colors[id]
        writeTimerSettings({ ...current, colors: colors })
    }

    const changeSoonMinutes = (id: TimerId, minutes: number) => {
        const current = readTimerSettings()

        writeTimerSettings({
            ...current,
            soonMinutes: { ...current.soonMinutes, [id]: minutes },
        })
    }

    const changeShowPinned = (showPinned: boolean) => {
        writeTimerSettings({ ...readTimerSettings(), showPinned: showPinned })
    }

    // Null clears the boss's timer.
    const changeBossReport = (id: TimerId, report: BossReport | null) => {
        const current = readTimerSettings()
        const bossReports = { ...current.bossReports }

        if (report) {
            bossReports[id] = report
        } else {
            delete bossReports[id]
        }

        writeTimerSettings({ ...current, bossReports: bossReports })
    }

    return {
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
