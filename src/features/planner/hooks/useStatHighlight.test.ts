// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
    HIGHLIGHT_DELAY_MS,
    useHighlightedStat,
    useStatHighlight,
} from "./useStatHighlight"

beforeEach(() => {
    vi.useFakeTimers()
})

afterEach(() => {
    vi.runOnlyPendingTimers()
    vi.useRealTimers()
})

const setup = () => {
    const board = renderHook(() => {
        return useHighlightedStat()
    })
    const attack = renderHook(() => {
        return useStatHighlight("attack")
    })
    const defense = renderHook(() => {
        return useStatHighlight("defense")
    })

    return { board: board, attack: attack, defense: defense }
}

// Leaves the highlight off for the next test.
const settle = (hide: () => void) => {
    act(() => {
        hide()
        vi.advanceTimersByTime(1000)
    })
}

describe("useStatHighlight", () => {
    it("highlights only after the name is hovered a while", () => {
        const { board, attack } = setup()

        act(() => {
            attack.result.current.show()
            vi.advanceTimersByTime(HIGHLIGHT_DELAY_MS - 1)
        })

        expect(board.result.current).toBeNull()

        act(() => {
            vi.advanceTimersByTime(1)
        })

        expect(board.result.current).toBe("attack")

        settle(attack.result.current.hide)
    })

    it("never highlights a name left before the delay", () => {
        const { board, attack } = setup()

        act(() => {
            attack.result.current.show()
            vi.advanceTimersByTime(HIGHLIGHT_DELAY_MS / 2)
            attack.result.current.hide()
            vi.advanceTimersByTime(HIGHLIGHT_DELAY_MS)
        })

        expect(board.result.current).toBeNull()
    })

    it("clears at once on leave, and the next name waits anew", () => {
        const { board, attack, defense } = setup()

        act(() => {
            attack.result.current.show()
            vi.advanceTimersByTime(HIGHLIGHT_DELAY_MS)
        })
        act(() => {
            attack.result.current.hide()
        })

        expect(board.result.current).toBeNull()

        act(() => {
            defense.result.current.show()
            vi.advanceTimersByTime(HIGHLIGHT_DELAY_MS - 1)
        })

        expect(board.result.current).toBeNull()

        act(() => {
            vi.advanceTimersByTime(1)
        })

        expect(board.result.current).toBe("defense")

        settle(defense.result.current.hide)
    })

    it("clears its highlight when the name goes away", () => {
        const { board, attack } = setup()

        act(() => {
            attack.result.current.show()
            vi.advanceTimersByTime(HIGHLIGHT_DELAY_MS)
        })
        attack.unmount()

        expect(board.result.current).toBeNull()
    })
})
