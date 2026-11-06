import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Tuesday 12:00 UTC: the daily reset is 19 hours away.
const TUESDAY_NOON = Date.UTC(2026, 10, 3, 12)

describe("useResetPeriods", () => {
    beforeEach(() => {
        vi.useFakeTimers()
        vi.setSystemTime(TUESDAY_NOON)
        // useNow keeps the clock in module state.
        vi.resetModules()
    })

    afterEach(() => {
        vi.useRealTimers()
    })

    it("keeps the same object between resets and changes at one", async () => {
        const { useResetPeriods } = await import("./useResetPeriods")
        const { result } = renderHook(() => useResetPeriods())
        const first = result.current

        act(() => vi.advanceTimersByTime(5000))

        expect(result.current).toBe(first)

        // Past Wednesday's 07:00 UTC reset.
        act(() => vi.advanceTimersByTime(20 * 60 * 60 * 1000))

        expect(result.current).not.toBe(first)
        expect(result.current.daily).toBe(first.daily + 1)
        expect(result.current.weekly).toBe(first.weekly + 1)
    })
})
