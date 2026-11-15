import { describe, expect, it } from "vitest"
import { WEEKLY_RESET, type TimerDefinition } from "@timers/config/timers"
import { getTimerAlert, getTimerState } from "./timerState"

const MINUTE = 60_000
const HOUR = 60 * MINUTE

const bossTimer = (boss: object) => {
    return { id: "test", boss: boss } as unknown as TimerDefinition
}

const scheduledTimer = (schedule: object) => {
    return { id: "test", schedule: schedule } as unknown as TimerDefinition
}

describe("getTimerState: fixed schedules", () => {
    const timer = scheduledTimer({
        anchor: 0,
        period: 10 * HOUR,
        openFor: HOUR,
    })

    it("is open during its window", () => {
        expect(getTimerState(timer, null, 10 * HOUR + MINUTE)).toEqual({
            status: "open",
            at: 11 * HOUR,
            startedAt: 10 * HOUR,
            afterMaintenance: false,
        })
    })

    it("counts down to the next period after it closes", () => {
        expect(getTimerState(timer, null, 11 * HOUR)).toMatchObject({
            status: "upcoming",
            at: 20 * HOUR,
        })
    })

    it("handles times before the anchor", () => {
        const late = scheduledTimer({
            anchor: 100 * HOUR,
            period: 10 * HOUR,
            openFor: HOUR,
        })

        expect(getTimerState(late, null, 95 * HOUR)).toMatchObject({
            status: "upcoming",
            at: 100 * HOUR,
        })
    })
})

describe("getTimerState: server schedules", () => {
    // Noon server time, 10:00 UTC in summer.
    const schedule = { times: [720], openFor: HOUR }
    const start = Date.UTC(2026, 6, 1, 10, 0)

    it("is open right after a start", () => {
        expect(
            getTimerState(scheduledTimer(schedule), null, start + MINUTE),
        ).toMatchObject({ status: "open", startedAt: start, at: start + HOUR })
    })

    it("closes when a boss on it was killed this window", () => {
        const timer = bossTimer({ schedule: schedule })

        expect(
            getTimerState(
                timer,
                { killedAt: start + MINUTE },
                start + 2 * MINUTE,
            ),
        ).toMatchObject({ status: "upcoming" })
    })

    it("ignores a kill from an earlier window", () => {
        const timer = bossTimer({ schedule: schedule })

        expect(
            getTimerState(timer, { killedAt: start - HOUR }, start + MINUTE),
        ).toMatchObject({ status: "open" })
    })
})

describe("getTimerState: reported bosses", () => {
    const boss = { respawn: HOUR }
    const spawnAt = 1_000_000 * 1000
    const report = { spawnAt: spawnAt, reportedAt: spawnAt - MINUTE }

    it("is unset without a report", () => {
        expect(getTimerState(bossTimer(boss), null, 0)).toEqual({
            status: "unset",
        })
    })

    it("stays killed on a kill report", () => {
        expect(getTimerState(bossTimer(boss), { killedAt: 500 }, 900)).toEqual({
            status: "killed",
            at: 500,
        })
    })

    it("counts down to a reported spawn", () => {
        expect(
            getTimerState(bossTimer(boss), report, spawnAt - MINUTE),
        ).toEqual({ status: "upcoming", at: spawnAt, afterMaintenance: false })
    })

    it("is up once its spawn time passes", () => {
        expect(getTimerState(bossTimer(boss), report, spawnAt)).toEqual({
            status: "up",
            at: spawnAt,
            afterMaintenance: false,
        })
    })

    it("stays up until a newer time comes in, projecting nothing", () => {
        expect(
            getTimerState(bossTimer(boss), report, spawnAt + 5 * HOUR),
        ).toMatchObject({ status: "up", at: spawnAt })
    })

    it("rounds the reported spawn to a whole second", () => {
        const rounded = getTimerState(
            bossTimer(boss),
            { spawnAt: spawnAt + 400, reportedAt: spawnAt - MINUTE },
            spawnAt - MINUTE,
        )

        expect(rounded).toMatchObject({ at: spawnAt })
    })

    it("flags a spawn past the weekly maintenance", () => {
        const reportedAt = WEEKLY_RESET.anchor + WEEKLY_RESET.period + HOUR
        const nextReset = WEEKLY_RESET.anchor + 2 * WEEKLY_RESET.period
        const before = { spawnAt: nextReset - HOUR, reportedAt: reportedAt }
        const after = { spawnAt: nextReset + HOUR, reportedAt: reportedAt }

        expect(
            getTimerState(bossTimer(boss), before, reportedAt),
        ).toMatchObject({ afterMaintenance: false })
        expect(getTimerState(bossTimer(boss), after, reportedAt)).toMatchObject(
            { status: "upcoming", afterMaintenance: true },
        )
        expect(
            getTimerState(bossTimer(boss), after, nextReset + 2 * HOUR),
        ).toMatchObject({ status: "up", afterMaintenance: true })
    })
})

describe("getTimerState: no source", () => {
    it("is unset", () => {
        expect(
            getTimerState({ id: "x" } as unknown as TimerDefinition, null, 0),
        ).toEqual({ status: "unset" })
    })
})

describe("getTimerAlert", () => {
    const countdown = { afterMaintenance: false }

    it("is active while open", () => {
        expect(
            getTimerAlert(
                { status: "open", startedAt: 0, at: 10, ...countdown },
                5,
                1,
            ),
        ).toBe("active")
    })

    it("is active while a boss is up", () => {
        expect(
            getTimerAlert({ status: "up", at: 0, ...countdown }, 5, HOUR),
        ).toBe("active")
    })

    it("is soon within the threshold, inclusive", () => {
        const state = {
            status: "upcoming" as const,
            at: 5 * MINUTE,
            ...countdown,
        }

        expect(getTimerAlert(state, 5, 0)).toBe("soon")
        expect(getTimerAlert(state, 4, 0)).toBe("idle")
    })

    it("is idle for a killed or unset timer", () => {
        expect(getTimerAlert({ status: "killed", at: 0 }, 5, 0)).toBe("idle")
        expect(getTimerAlert({ status: "unset" }, 5, 0)).toBe("idle")
    })
})
