import { describe, expect, it } from "vitest"
import { getNextReset, getResetPeriods, readCount } from "./resetPeriods"

// Wednesday 4 November 2026: both resets at 07:00 UTC.
const BEFORE_RESET = Date.UTC(2026, 10, 4, 6, 59)
const AFTER_RESET = Date.UTC(2026, 10, 4, 7, 0)

describe("getResetPeriods", () => {
    it("moves on at the daily reset", () => {
        const before = getResetPeriods(BEFORE_RESET)
        const after = getResetPeriods(AFTER_RESET)

        expect(after.daily).toBe(before.daily + 1)
    })

    it("moves the weekly period only on Wednesday", () => {
        const wednesday = getResetPeriods(AFTER_RESET)
        const tuesday = getResetPeriods(AFTER_RESET - 24 * 3_600_000)
        const nextTuesday = getResetPeriods(AFTER_RESET + 6 * 24 * 3_600_000)

        expect(wednesday.weekly).toBe(tuesday.weekly + 1)
        expect(nextTuesday.weekly).toBe(wednesday.weekly)
    })
})

describe("one-off goals", () => {
    it("never leave period 0, so their counts never clear", () => {
        expect(getResetPeriods(BEFORE_RESET).once).toBe(0)
        expect(getResetPeriods(AFTER_RESET + 365 * 24 * 3_600_000).once).toBe(0)
    })
})

describe("energy recharge", () => {
    it("moves on at each recharge, 8 times a day", () => {
        const before = getResetPeriods(BEFORE_RESET)
        const after = getResetPeriods(AFTER_RESET)
        const nextDay = getResetPeriods(AFTER_RESET + 24 * 3_600_000)

        expect(after.energy).toBe(before.energy + 1)
        expect(nextDay.energy).toBe(after.energy + 8)
    })
})

describe("getNextReset", () => {
    it("is the coming 07:00 UTC for dailies", () => {
        expect(getNextReset("daily", BEFORE_RESET)).toBe(AFTER_RESET)
        expect(getNextReset("daily", AFTER_RESET)).toBe(
            AFTER_RESET + 24 * 3_600_000,
        )
    })

    it("is the coming Wednesday for weeklies", () => {
        expect(getNextReset("weekly", BEFORE_RESET)).toBe(AFTER_RESET)
        expect(getNextReset("weekly", AFTER_RESET)).toBe(
            AFTER_RESET + 7 * 24 * 3_600_000,
        )
    })
})

// Artifact Siege: Thursday and Saturday 21:00 server time (UTC+1 in
// November), so 20:00 UTC.
const THURSDAY_SIEGE = Date.UTC(2026, 10, 5, 20)
const SATURDAY_SIEGE = Date.UTC(2026, 10, 7, 20)
const NEXT_THURSDAY_SIEGE = Date.UTC(2026, 10, 12, 20)
// Summer time (UTC+2): 19:00 UTC.
const SUMMER_SIEGE = Date.UTC(2026, 6, 2, 19)

describe("siege reset", () => {
    it("moves on at each Artifact Siege only", () => {
        const before = getResetPeriods(THURSDAY_SIEGE - 1)
        const thursday = getResetPeriods(THURSDAY_SIEGE)
        const friday = getResetPeriods(THURSDAY_SIEGE + 24 * 3_600_000)
        const saturday = getResetPeriods(SATURDAY_SIEGE)

        expect(thursday.siege).toBeGreaterThan(before.siege)
        expect(friday.siege).toBe(thursday.siege)
        expect(saturday.siege).toBeGreaterThan(friday.siege)
    })

    it("counts down to the next siege, across the weekend gap", () => {
        expect(getNextReset("siege", THURSDAY_SIEGE - 1)).toBe(THURSDAY_SIEGE)
        expect(getNextReset("siege", THURSDAY_SIEGE)).toBe(SATURDAY_SIEGE)
        expect(getNextReset("siege", SATURDAY_SIEGE)).toBe(NEXT_THURSDAY_SIEGE)
        // Wednesday: no siege in the day before, still the coming Thursday.
        expect(getNextReset("siege", Date.UTC(2026, 10, 11, 12))).toBe(
            NEXT_THURSDAY_SIEGE,
        )
    })

    it("follows server time in summer", () => {
        expect(getNextReset("siege", SUMMER_SIEGE - 1)).toBe(SUMMER_SIEGE)
    })
})

describe("readCount", () => {
    it("reads a count from this period", () => {
        expect(readCount({ period: 5, count: 3 }, 5)).toBe(3)
    })

    it("reads 0 for an older period or no count", () => {
        expect(readCount({ period: 4, count: 3 }, 5)).toBe(0)
        expect(readCount(undefined, 5)).toBe(0)
    })
})
