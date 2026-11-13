// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { isPageVisible, pollWhileVisible } from "./pageVisibility"

let visibility: DocumentVisibilityState = "visible"

const setVisibility = (next: DocumentVisibilityState) => {
    visibility = next
    document.dispatchEvent(new Event("visibilitychange"))
}

beforeEach(() => {
    visibility = "visible"
    vi.spyOn(document, "visibilityState", "get").mockImplementation(() => {
        return visibility
    })
    vi.useFakeTimers()
})

afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
})

describe("isPageVisible", () => {
    it("follows the document", () => {
        expect(isPageVisible()).toBe(true)

        visibility = "hidden"

        expect(isPageVisible()).toBe(false)
    })
})

describe("pollWhileVisible", () => {
    it("runs at once, then every interval while visible", () => {
        const task = vi.fn()
        const stop = pollWhileVisible(task, 10_000)

        expect(task).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(10_000)

        expect(task).toHaveBeenCalledTimes(2)

        vi.advanceTimersByTime(10_000)

        expect(task).toHaveBeenCalledTimes(3)
        stop()
    })

    it("waits for the page when started hidden", () => {
        visibility = "hidden"

        const task = vi.fn()
        const stop = pollWhileVisible(task, 10_000)

        vi.advanceTimersByTime(60_000)

        expect(task).not.toHaveBeenCalled()

        setVisibility("visible")

        expect(task).toHaveBeenCalledTimes(1)
        stop()
    })

    it("keeps counting down while hidden, then holds the run until shown", () => {
        const task = vi.fn()
        const stop = pollWhileVisible(task, 10_000)

        vi.advanceTimersByTime(5_000)
        setVisibility("hidden")
        vi.advanceTimersByTime(30_000)

        expect(task).toHaveBeenCalledTimes(1)

        setVisibility("visible")

        expect(task).toHaveBeenCalledTimes(2)

        vi.advanceTimersByTime(10_000)

        expect(task).toHaveBeenCalledTimes(3)
        stop()
    })

    it("doesn't run early when shown again before the countdown ends", () => {
        const task = vi.fn()
        const stop = pollWhileVisible(task, 10_000)

        vi.advanceTimersByTime(3_000)
        setVisibility("hidden")
        vi.advanceTimersByTime(4_000)
        setVisibility("visible")

        expect(task).toHaveBeenCalledTimes(1)

        vi.advanceTimersByTime(3_000)

        expect(task).toHaveBeenCalledTimes(2)
        stop()
    })

    it("stops for good", () => {
        const task = vi.fn()
        const stop = pollWhileVisible(task, 10_000)

        stop()
        vi.advanceTimersByTime(30_000)
        setVisibility("hidden")
        setVisibility("visible")

        expect(task).toHaveBeenCalledTimes(1)
    })
})
