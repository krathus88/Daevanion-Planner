import { describe, expect, it } from "vitest"
import { getTimerState } from "@timers/logic/timerState"
import { FIELD_BOSSES } from "./fieldBosses"
import { TIMERS, type TimerId } from "./timers"

const MINUTE = 60_000
const HOUR = 60 * MINUTE

const getTimer = (id: TimerId) => {
    const timer = TIMERS.find((entry) => entry.id === id)

    if (!timer) {
        throw new Error(`No timer ${id}`)
    }

    return timer
}

// November 2026 is winter time: server time = UTC + 1.
// Monday 2 November 2026, 22:00 server time.
const mondayNight = Date.UTC(2026, 10, 2, 21)

describe("schedules from the 4 Nov 2026 patch", () => {
    it("holds the Artifact Siege on Thursday and Saturday only", () => {
        expect(
            getTimerState(getTimer("siege"), null, mondayNight - 2 * HOUR),
        ).toMatchObject({ status: "upcoming", at: Date.UTC(2026, 10, 5, 20) })
    })

    it.each(["argo", "executor-kaira", "tamasa"] as const)(
        "spawns %s on Thursday and Saturday at 21:30",
        (id) => {
            expect(
                getTimerState(getTimer(id), null, mondayNight - 2 * HOUR),
            ).toMatchObject({
                status: "upcoming",
                at: Date.UTC(2026, 10, 5, 20, 30),
            })
        },
    )

    it("spawns Argo, the Spirit King at 10:30 and 22:30", () => {
        const timer = getTimer("argo-spirit-king")
        const morning = Date.UTC(2026, 10, 4, 9, 30)

        expect(getTimerState(timer, null, morning - HOUR)).toMatchObject({
            status: "upcoming",
            at: morning,
        })
        expect(getTimerState(timer, null, morning + MINUTE)).toMatchObject({
            status: "open",
            startedAt: morning,
        })
        expect(getTimerState(timer, null, morning + 11 * MINUTE)).toMatchObject(
            { status: "upcoming", at: morning + 12 * HOUR },
        )
    })

    it.each(["lagta", "gartua", "lagta-altgard", "immortal-gartua"] as const)(
        "expects %s to die 10 seconds after spawning",
        (id) => {
            const spawnAt = Date.UTC(2026, 10, 4, 12)
            const report = { spawnAt: spawnAt, reportedAt: spawnAt - HOUR }

            expect(
                getTimerState(getTimer(id), report, spawnAt + 5000),
            ).toMatchObject({ status: "open", at: spawnAt + 10_000 })
            expect(
                getTimerState(getTimer(id), report, spawnAt + 11_000),
            ).toMatchObject({
                status: "upcoming",
                at: spawnAt + 10_000 + 11 * HOUR,
            })
        },
    )

    it("respawns Lagta and Gartua 11 hours after they die", () => {
        const ids = ["lagta", "gartua", "lagta-altgard", "immortal-gartua"]

        expect(
            FIELD_BOSSES.filter((boss) => ids.includes(boss.id)).map(
                (boss) => boss.respawn,
            ),
        ).toEqual([11 * HOUR, 11 * HOUR, 11 * HOUR, 11 * HOUR])
    })
})
