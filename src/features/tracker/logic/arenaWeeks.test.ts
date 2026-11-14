import type { ArenaSighting } from "@tracker/types"
import { describe, expect, it } from "vitest"
import {
    fixArenaTask,
    getArenaTaskWeek,
    isArenaTaskKnown,
    isArenaTaskUnknown,
    updateArenaRecord,
} from "./arenaWeeks"

// A mode's week as [played, won] (5v5 is mode 2, 1v1 mode 1).
const getWeek = (
    record: Parameters<typeof getArenaTaskWeek>[0],
    mode: string,
) => {
    const [played, won] =
        mode === "2"
            ? ["arena-participation", "arena-wins"]
            : ["arena-1v1-participation", "arena-1v1-wins"]
    const week = {
        played: getArenaTaskWeek(record, played),
        won: getArenaTaskWeek(record, won),
    }

    return week.played === null || week.won === null ? null : week
}

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

        expect(getWeek(record, "2")).toEqual({ played: 2, won: 1 })
        expect(getWeek(record, "1")).toEqual({ played: 1, won: 1 })
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
        expect(getWeek(record, "2")).toEqual({ played: 2, won: 1 })
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

        expect(getWeek(record, "2")).toBeNull()
        expect(isArenaTaskUnknown(record, 5, "arena-wins")).toBe(true)
    })

    it("leaves the week unknown without totals or an earlier sighting", () => {
        expect(
            isArenaTaskUnknown(
                updateArenaRecord(undefined, AFTER_LOSS, null),
                5,
                "arena-wins",
            ),
        ).toBe(true)
        expect(
            isArenaTaskUnknown(
                updateArenaRecord(undefined, AFTER_LOSS, { played: 1, won: 0 }),
                5,
                "arena-wins",
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
        expect(getWeek(record, "2")).toEqual({ played: 1, won: 0 })
    })

    it("isn't unknown in a week it wasn't seen", () => {
        const record = updateArenaRecord(undefined, AFTER_LOSS, null)

        expect(isArenaTaskUnknown(record, 6, "arena-wins")).toBe(false)
        expect(isArenaTaskUnknown(undefined, 5, "arena-wins")).toBe(false)
    })
})

describe("fixArenaTask", () => {
    // Seen this week at 18-21 in 5v5 and 1-0 in 1v1, start unknown.
    const unknown = updateArenaRecord(undefined, AFTER_1V1, null)

    it("sets only the task entered, from the count shown", () => {
        const record = fixArenaTask(unknown, "arena-wins", 1)

        expect(getArenaTaskWeek(record, "arena-wins")).toBe(1)
        expect(isArenaTaskKnown(record, 5, "arena-wins")).toBe(true)
        // Its participation and the 1v1 tasks stay unknown.
        expect(isArenaTaskUnknown(record, 5, "arena-participation")).toBe(true)
        expect(isArenaTaskUnknown(record, 5, "arena-1v1-wins")).toBe(true)
        expect(isArenaTaskUnknown(record, 5, "arena-1v1-participation")).toBe(
            true,
        )
    })

    it("counts later matches on top of the count entered", () => {
        const fixed = fixArenaTask(unknown, "arena-participation", 2)
        const later = updateArenaRecord(
            fixed,
            sighting(5, 9, { "1": [1, 0], "2": [19, 22] }),
            null,
        )

        expect(getArenaTaskWeek(later, "arena-participation")).toBe(4)
        expect(getArenaTaskWeek(later, "arena-wins")).toBeNull()
    })

    it("forgets the tasks set by hand once the week is over", () => {
        const fixed = fixArenaTask(unknown, "arena-wins", 1)
        const nextWeek = updateArenaRecord(
            fixed,
            sighting(6, 9, { "1": [1, 0], "2": [19, 22] }),
            null,
        )

        expect(nextWeek.fixed).toBeUndefined()
        expect(isArenaTaskUnknown(nextWeek, 6, "arena-wins")).toBe(true)
    })

    it("leaves a week whose start the game knows alone", () => {
        const known = updateArenaRecord(undefined, START, {
            played: 0,
            won: 0,
        })

        expect(fixArenaTask(known, "arena-wins", 9)).toBe(known)
    })
})
