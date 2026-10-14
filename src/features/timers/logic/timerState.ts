import type { FieldBoss } from "@timers/config/fieldBosses"
import {
    BOSS_ALIVE_FOR,
    WEEKLY_RESET,
    type FixedSchedule,
    type TimerDefinition,
} from "@timers/config/timers"
import type { BossReport } from "@timers/storage/timerSettings"

export type TimerState =
    // A field boss nobody has entered a timer or kill for.
    | { status: "unset" }
    // A boss with no known respawn, counted up from its last kill.
    | { status: "killed"; at: number }
    | {
          // "open" counts down to the event closing, "upcoming" to it starting.
          status: "open" | "upcoming"
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

const getBossState = (
    boss: FieldBoss,
    report: BossReport | null,
    now: number,
): TimerState => {
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

    return {
        status: isAlive ? "open" : "upcoming",
        at: isAlive ? spawnAt + BOSS_ALIVE_FOR : shownSpawnAt,
        estimated: shownCycle > 0,
        afterMaintenance: nextWeeklyReset <= shownSpawnAt,
    }
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
        return getFixedState(timer.schedule, now)
    }

    return { status: "unset" }
}
