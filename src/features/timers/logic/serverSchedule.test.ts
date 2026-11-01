import { describe, expect, it } from "vitest"
import { everyHours, getServerStarts } from "./serverSchedule"

const NOON = 12 * 60

describe("everyHours", () => {
    it("steps through the day from the first hour", () => {
        expect(everyHours(3, 1)).toEqual([
            60, 240, 420, 600, 780, 960, 1140, 1320,
        ])
    })

    it("stops before midnight", () => {
        expect(everyHours(12, 12)).toEqual([720])
    })
})

describe("getServerStarts", () => {
    it("reads server time as UTC+2 in summer", () => {
        const now = Date.UTC(2026, 6, 1, 9, 0)

        expect(getServerStarts({ times: [NOON], openFor: 0 }, now)).toEqual({
            last: Date.UTC(2026, 5, 30, 10, 0),
            next: Date.UTC(2026, 6, 1, 10, 0),
        })
    })

    it("reads server time as UTC+1 in winter", () => {
        const now = Date.UTC(2026, 0, 15, 9, 0)

        expect(getServerStarts({ times: [NOON], openFor: 0 }, now).next).toBe(
            Date.UTC(2026, 0, 15, 11, 0),
        )
    })

    it("counts a start at this exact moment as the last one", () => {
        const now = Date.UTC(2026, 6, 1, 10, 0)
        const starts = getServerStarts({ times: [NOON], openFor: 0 }, now)

        expect(starts.last).toBe(now)
        expect(starts.next).toBe(Date.UTC(2026, 6, 2, 10, 0))
    })

    it("uses the new offset the day the clocks go forward", () => {
        // Sunday 29 March 2026: 02:00 jumps to 03:00 at 01:00 UTC.
        const before = Date.UTC(2026, 2, 28, 23, 0)
        const after = Date.UTC(2026, 2, 29, 6, 0)

        expect(getServerStarts({ times: [90], openFor: 0 }, before).next).toBe(
            Date.UTC(2026, 2, 29, 0, 30),
        )
        expect(getServerStarts({ times: [NOON], openFor: 0 }, after).next).toBe(
            Date.UTC(2026, 2, 29, 10, 0),
        )
    })

    it("moves a start the clock skips to just after the jump", () => {
        // 02:30 doesn't exist that night; it lands on 03:30.
        const before = Date.UTC(2026, 2, 28, 23, 0)

        expect(getServerStarts({ times: [150], openFor: 0 }, before).next).toBe(
            Date.UTC(2026, 2, 29, 1, 30),
        )
    })

    it("uses the old offset the day the clocks go back", () => {
        const now = Date.UTC(2026, 9, 25, 6, 0)

        expect(getServerStarts({ times: [NOON], openFor: 0 }, now).next).toBe(
            Date.UTC(2026, 9, 25, 11, 0),
        )
    })

    it("finds the next start of a weekly schedule", () => {
        // A Wednesday; 0 is Sunday.
        const now = Date.UTC(2026, 6, 1, 9, 0)

        expect(
            getServerStarts({ times: [NOON], days: [0], openFor: 0 }, now).next,
        ).toBe(Date.UTC(2026, 6, 5, 10, 0))
    })

    it("picks the day from the server's date, not UTC's", () => {
        // 23:30 UTC on Saturday is already 01:30 Sunday on the server.
        const now = Date.UTC(2026, 6, 4, 23, 30)

        expect(
            getServerStarts({ times: [120], days: [0], openFor: 0 }, now).next,
        ).toBe(Date.UTC(2026, 6, 5, 0, 0))
    })

    it("walks several starts in one day", () => {
        const now = Date.UTC(2026, 6, 1, 10, 30)

        expect(
            getServerStarts({ times: [NOON, 18 * 60], openFor: 0 }, now),
        ).toEqual({
            last: Date.UTC(2026, 6, 1, 10, 0),
            next: Date.UTC(2026, 6, 1, 16, 0),
        })
    })

    it("throws for a schedule that never starts", () => {
        expect(() => {
            return getServerStarts({ times: [NOON], days: [], openFor: 0 }, 0)
        }).toThrow("at least one start")
    })
})
