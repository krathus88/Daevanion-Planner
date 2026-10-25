import type { FieldBoss } from "@timers/config/fieldBosses"
import {
    BOSS_ALIVE_FOR,
    WEEKLY_RESET,
    type FixedSchedule,
    type TimerDefinition,
} from "@timers/config/timers"
import type { BossReport } from "@timers/storage/timerSettings"
import { getServerStarts, type ServerSchedule } from "./serverSchedule"

export type TimerState =
    | { status: "unset" }
    | { status: "killed"; at: number }
    | ({ status: "open"; startedAt: number } & Countdown)
    | ({ status: "upcoming" } & Countdown)

type Countdown = {
    at: number
    estimated: boolean
    afterMaintenance: boolean
}

const lastStart = (schedule: FixedSchedule, time: number) => {
    const periods = Math.floor((time - schedule.anchor) / schedule.period)

    return schedule.anchor + periods * schedule.period
}

const getFixedState = (schedule: FixedSchedule, now: number): TimerState => {
    const start = lastStart(schedule, now)

    if (now - start < schedule.openFor) {
        return {
            status: "open",
            at: start + schedule.openFor,
            startedAt: start,
            estimated: false,
            afterMaintenance: false,
        }
    }

    return {
        status: "upcoming",
        at: start + schedule.period,
        estimated: false,
        afterMaintenance: false,
    }
}

const getServerState = (
    schedule: ServerSchedule,
    killedAt: number | null,
    now: number,
): TimerState => {
    const { last, next } = getServerStarts(schedule, now)

    if (
        last !== null &&
        now - last < schedule.openFor &&
        (killedAt === null || killedAt < last)
    ) {
        return {
            status: "open",
            at: last + schedule.openFor,
            startedAt: last,
            estimated: false,
            afterMaintenance: false,
        }
    }

    return {
        status: "upcoming",
        at: next,
        estimated: false,
        afterMaintenance: false,
    }
}

const getBossState = (
    boss: FieldBoss,
    report: BossReport | null,
    now: number,
): TimerState => {
    if (boss.schedule) {
        return getServerState(
            boss.schedule,
            report && "killedAt" in report ? report.killedAt : null,
            now,
        )
    }

    if (!report) {
        return { status: "unset" }
    }

    if ("killedAt" in report) {
        return { status: "killed", at: report.killedAt }
    }

    // On a whole second so it ticks in step with the clock.
    const firstSpawnAt = Math.round(report.spawnAt / 1000) * 1000
    const aliveFor = boss.aliveFor ?? BOSS_ALIVE_FOR
    const killedAt = firstSpawnAt + aliveFor

    if (boss.respawn === null && now >= killedAt) {
        return { status: "killed", at: killedAt }
    }

    const cycleLength = aliveFor + (boss.respawn ?? 0)
    const cycle = Math.max(0, Math.floor((now - firstSpawnAt) / cycleLength))
    const spawnAt = firstSpawnAt + cycle * cycleLength
    const isAlive = now >= spawnAt && now - spawnAt < aliveFor
    const shownCycle = isAlive || now < spawnAt ? cycle : cycle + 1
    const shownSpawnAt = firstSpawnAt + shownCycle * cycleLength
    const nextWeeklyReset =
        lastStart(WEEKLY_RESET, report.reportedAt) + WEEKLY_RESET.period

    const countdown = {
        estimated: shownCycle > 0,
        afterMaintenance: nextWeeklyReset <= shownSpawnAt,
    }

    if (isAlive) {
        return {
            status: "open",
            at: spawnAt + aliveFor,
            startedAt: spawnAt,
            ...countdown,
        }
    }

    return { status: "upcoming", at: shownSpawnAt, ...countdown }
}

export type TimerAlert = "idle" | "soon" | "active"

export const getTimerAlert = (
    state: TimerState,
    soonMinutes: number,
    now: number,
): TimerAlert => {
    if (state.status === "open") {
        return "active"
    }

    if (state.status === "upcoming" && state.at - now <= soonMinutes * 60_000) {
        return "soon"
    }

    return "idle"
}

export const getTimerState = (
    timer: TimerDefinition,
    report: BossReport | null,
    now: number,
): TimerState => {
    if (timer.boss) {
        return getBossState(timer.boss, report, now)
    }

    if (timer.schedule) {
        return "anchor" in timer.schedule
            ? getFixedState(timer.schedule, now)
            : getServerState(timer.schedule, null, now)
    }

    return { status: "unset" }
}
