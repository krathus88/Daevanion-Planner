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
    // A field boss nobody has entered a timer or kill for.
    | { status: "unset" }
    // A boss with no known respawn, counted up from its last kill.
    | { status: "killed"; at: number }
    // Counts down to the event closing, from when it started.
    | ({ status: "open"; startedAt: number } & Countdown)
    // Counts down to the event starting.
    | ({ status: "upcoming" } & Countdown)

type Countdown = {
    at: number
    // Worked out from an earlier spawn, assuming the boss died about a
    // minute after spawning.
    estimated: boolean
    // A weekly maintenance happened between the report and this spawn.
    afterMaintenance: boolean
}

// The latest start at or before `time`.
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

// A schedule in EU server time. A kill during a spawn ends it early.
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

    // On a whole second, like every other timer, so the clock ticks in step
    // with it. Spawns are firstSpawnAt + cycle * cycleLength.
    const firstSpawnAt = Math.round(report.spawnAt / 1000) * 1000
    const killedAt = firstSpawnAt + BOSS_ALIVE_FOR

    // With no known respawn, nothing follows the first spawn.
    if (boss.respawn === null && now >= killedAt) {
        return { status: "killed", at: killedAt }
    }

    const cycleLength = BOSS_ALIVE_FOR + (boss.respawn ?? 0)
    const cycle = Math.max(0, Math.floor((now - firstSpawnAt) / cycleLength))
    const spawnAt = firstSpawnAt + cycle * cycleLength
    const isAlive = now >= spawnAt && now - spawnAt < BOSS_ALIVE_FOR
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
            at: spawnAt + BOSS_ALIVE_FOR,
            startedAt: spawnAt,
            ...countdown,
        }
    }

    return { status: "upcoming", at: shownSpawnAt, ...countdown }
}

// How urgently a timer should draw the eye.
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
