import type { ArenaSighting } from "@tracker/types"
import { describe, expect, it } from "vitest"
import {
    getArenaWeek,
    isArenaWeekUnknown,
    updateArenaRecord,
} from "./arenaWeeks"

// Kryx's real records on 2026-11-12: mode 2 (5v5) at 17 wins, 20 losses
// before the week's first match, then a loss, a win, and a 1v1 win.
const sighting = (
    period: number,
    at: number,
    modes: ArenaSighting["modes"],
): ArenaSighting => {
    return { period: period, at: at, modes: modes }
}

const START = sighting(5, 1, { "1": [0, 0], "2": [17, 20] })
const AFTER_LOSS = sighting(5, 2, { "1": [0, 0], "2": [17, 21] })
const AFTER_1V1 = sighting(5, 4, { "1": [1, 0], "2": [18, 21] })

describe("updateArenaRecord", () => {
    it("takes a sighting with no match this week as the week's start", () => {
        const record = updateArenaRecord(undefined, START, {
            played: 0,
            won: 0,
        })

        expect(record.base).toEqual(START)
    })

    it("counts each mode's week from that start", () => {
        const start = updateArenaRecord(undefined, START, {
            played: 0,
            won: 0,
        })
        const record = updateArenaRecord(start, AFTER_1V1, {
            played: 3,
            won: 2,
        })

        expect(getArenaWeek(record, "2")).toEqual({ played: 2, won: 1 })
        expect(getArenaWeek(record, "1")).toEqual({ played: 1, won: 1 })
    })

    it("takes last week's last sighting when it adds up to the week's totals", () => {
        const lastWeek = updateArenaRecord(
            undefined,
            { ...START, period: 4 },
            null,
        )
        const record = updateArenaRecord(lastWeek, AFTER_1V1, {
            played: 3,
            won: 2,
        })

        expect(record.base?.period).toBe(5)
        expect(getArenaWeek(record, "2")).toEqual({ played: 2, won: 1 })
    })

    it("leaves the week unknown when matches were played after the last sighting", () => {
        // Last seen before the loss, last week: the loss isn't this week's.
        const lastWeek = updateArenaRecord(
            undefined,
            { ...START, period: 4 },
            null,
        )
        const record = updateArenaRecord(lastWeek, AFTER_1V1, {
            played: 1,
            won: 1,
        })

        expect(getArenaWeek(record, "2")).toBeNull()
        expect(isArenaWeekUnknown(record, 5)).toBe(true)
    })

    it("leaves the week unknown without totals or an earlier sighting", () => {
        expect(
            isArenaWeekUnknown(
                updateArenaRecord(undefined, AFTER_LOSS, null),
                5,
            ),
        ).toBe(true)
        expect(
            isArenaWeekUnknown(
                updateArenaRecord(undefined, AFTER_LOSS, { played: 1, won: 0 }),
                5,
            ),
        ).toBe(true)
    })

    it("keeps the week's start for later sightings in the same week", () => {
        const start = updateArenaRecord(undefined, START, {
            played: 0,
            won: 0,
        })
        const record = updateArenaRecord(start, AFTER_LOSS, null)

        expect(record.base).toEqual(START)
        expect(getArenaWeek(record, "2")).toEqual({ played: 1, won: 0 })
    })

    it("isn't unknown in a week it wasn't seen", () => {
        const record = updateArenaRecord(undefined, AFTER_LOSS, null)

        expect(isArenaWeekUnknown(record, 6)).toBe(false)
        expect(isArenaWeekUnknown(undefined, 5)).toBe(false)
    })
})
