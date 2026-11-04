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

describe("readCount", () => {
    it("reads a count from this period", () => {
        expect(readCount({ period: 5, count: 3 }, 5)).toBe(3)
    })

    it("reads 0 for an older period or no count", () => {
        expect(readCount({ period: 4, count: 3 }, 5)).toBe(0)
        expect(readCount(undefined, 5)).toBe(0)
    })
})
