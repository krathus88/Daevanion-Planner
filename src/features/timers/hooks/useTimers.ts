import {
    getReportScope,
    getServer,
    getServerRegions,
} from "@timers/config/servers"
import {
    TIMERS,
    type TimerColor,
    type TimerDefinition,
    type TimerId,
} from "@timers/config/timers"
import { getComingNext, isInComingNext } from "@timers/logic/comingNext"
import { isPinned } from "@timers/logic/pinnedColumns"
import { pickReport, type ReportSource } from "@timers/logic/pickReport"
import {
    getTimerAlert,
    getTimerState,
    type TimerAlert,
    type TimerState,
} from "@timers/logic/timerState"
import {
    getSharedReportKey,
    writeSharedReport,
} from "@timers/shared/sharedReports"
import type { BossReport } from "@timers/storage/timerSettings"
import { useAuth } from "@account/hooks/useAuth"
import { useNow } from "./useNow"
import { useSharedReports } from "./useSharedReports"
import { useTimerSettings } from "./useTimerSettings"

export type TimerEntry = {
    timer: TimerDefinition
    state: TimerState
    alert: TimerAlert
    pinned: boolean
    inComingNext: boolean
    color: TimerColor
    hasCustomColor: boolean
    soonMinutes: number
    report: BossReport | null
    reportSource: ReportSource | null
    // Shared reports only clear for people who can share.
    canClearReport: boolean
}

export const useTimers = () => {
    const now = useNow()
    const auth = useAuth()
    const {
        settings,
        togglePinned,
        changePinnedColumns,
        changeTimerColor,
        resetTimerColor,
        changeSoonMinutes,
        changeShowPinned,
        changeShowComingNext,
        changeComingNextCount,
        changeComingNextPosition,
        changeServer,
        changeShowShared,
        changeBossReport: changeLocalReport,
    } = useTimerSettings()
    const server = getServer(settings.server)
    const sharedReports = useSharedReports(
        settings.showShared ? [server.id, server.pairId] : null,
    )

    const canShare =
        settings.showShared && auth.status === "signedIn" && auth.isReporter
    const regions = getServerRegions(server)

    const getScope = (timer: TimerDefinition) => {
        return timer.boss ? getReportScope(server, timer.boss.region) : null
    }

    // Shared when allowed, else (or when the database refuses) local only.
    const changeBossReport = async (id: TimerId, report: BossReport | null) => {
        const timer = TIMERS.find((item) => item.id === id)
        const scope = timer ? getScope(timer) : null

        if (canShare && scope && (await writeSharedReport(scope, id, report))) {
            // Otherwise a stale local report could reappear after a clear.
            changeLocalReport(id, null)

            return
        }

        changeLocalReport(id, report)
    }

    // Only the selected server's faction, plus the Abyss.
    const shownTimers = TIMERS.filter(
        (timer) => !timer.boss || regions.includes(timer.boss.region),
    )
    const timers: TimerEntry[] = shownTimers.map((timer) => {
        const scope = getScope(timer)
        const { report, source } = pickReport(
            settings.bossReports[timer.id] ?? null,
            scope
                ? (sharedReports[getSharedReportKey(scope, timer.id)] ?? null)
                : null,
        )
        const state = getTimerState(timer, report, now)
        const soonMinutes = settings.soonMinutes[timer.id] ?? timer.soonMinutes

        return {
            timer: timer,
            state: state,
            alert: getTimerAlert(state, soonMinutes, now),
            pinned: isPinned(settings.pinned, timer.id),
            inComingNext: isInComingNext(settings.comingNext, timer),
            color: settings.colors[timer.id] ?? timer.color,
            hasCustomColor: settings.colors[timer.id] !== undefined,
            soonMinutes: soonMinutes,
            report: report,
            reportSource: source,
            canClearReport:
                source === "local" || (source === "shared" && canShare),
        }
    })
    const entryById = new Map(timers.map((entry) => [entry.timer.id, entry]))
    const pinnedColumns = settings.pinned.flatMap((column) => {
        const entries = column.flatMap((id) => entryById.get(id) ?? [])

        return entries.length > 0 ? [entries] : []
    })
    const comingNext = getComingNext(timers, settings.comingNextCount)

    return {
        now: now,
        server: server,
        timers: timers,
        pinnedColumns: pinnedColumns,
        comingNext: comingNext,
        settings: settings,
        canShare: canShare,
        togglePinned: togglePinned,
        changePinnedColumns: changePinnedColumns,
        changeTimerColor: changeTimerColor,
        resetTimerColor: resetTimerColor,
        changeSoonMinutes: changeSoonMinutes,
        changeShowPinned: changeShowPinned,
        changeShowComingNext: changeShowComingNext,
        changeComingNextCount: changeComingNextCount,
        changeComingNextPosition: changeComingNextPosition,
        changeServer: changeServer,
        changeShowShared: changeShowShared,
        changeBossReport: changeBossReport,
    }
}
