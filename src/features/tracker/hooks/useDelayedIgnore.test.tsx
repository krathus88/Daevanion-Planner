import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { useDelayedIgnore } from "./useDelayedIgnore"
import { DONE_LEAVE_MS } from "./useDoneStash"

describe("useDelayedIgnore", () => {
    beforeEach(() => {
        vi.useFakeTimers()
    })

    afterEach(() => {
        vi.useRealTimers()
        vi.restoreAllMocks()
    })

    it("fades a task out first, then ignores it", () => {
        const onIgnore = vi.fn()
        const onBeforeMove = vi.fn()
        const { result } = renderHook(() =>
            useDelayedIgnore(onIgnore, onBeforeMove),
        )

        act(() => result.current.ignore("arena"))

        expect(result.current.ignoring).toEqual(["arena"])
        expect(onIgnore).not.toHaveBeenCalled()

        // A second click while it fades does nothing more.
        act(() => result.current.ignore("arena"))
        act(() => vi.advanceTimersByTime(DONE_LEAVE_MS))

        expect(onBeforeMove).toHaveBeenCalledTimes(1)
        expect(onIgnore).toHaveBeenCalledTimes(1)
        expect(onIgnore).toHaveBeenCalledWith("arena")
        expect(result.current.ignoring).toEqual([])
    })

    it("ignores at once when the user prefers reduced motion", () => {
        vi.spyOn(window, "matchMedia").mockReturnValue({
            matches: true,
        } as MediaQueryList)
        const onIgnore = vi.fn()
        const { result } = renderHook(() => useDelayedIgnore(onIgnore, vi.fn()))

        act(() => result.current.ignore("arena"))

        expect(onIgnore).toHaveBeenCalledWith("arena")
        expect(result.current.ignoring).toEqual([])
    })

    it("ignores at once when unmounted mid-fade", () => {
        const onIgnore = vi.fn()
        const { result, unmount } = renderHook(() =>
            useDelayedIgnore(onIgnore, vi.fn()),
        )

        act(() => result.current.ignore("arena"))
        unmount()

        expect(onIgnore).toHaveBeenCalledWith("arena")
    })
})
