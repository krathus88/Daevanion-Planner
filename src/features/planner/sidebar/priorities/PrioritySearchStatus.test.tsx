import { act, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { ReceivedProgress } from "@planner/hooks/usePriorityOptimizer"
import { renderWithChakra } from "@test/renderWithChakra"
import { PrioritySearchStatus } from "./PrioritySearchStatus"

// useNow ticks 50ms after each whole second; starting on a tick keeps the
// steps below whole seconds.
const START = 1_000_050

const refining: ReceivedProgress = {
    elapsedMs: 135_400,
    idleMs: 110_200,
    stallMs: 120_000,
    phase: "refine",
    pointsUsed: 403,
    finds: {
        optionsChecked: 479_075,
        firstFoundMs: 2000,
        improvements: 13,
        lastImprovedMs: 24_000,
    },
    receivedAt: START,
}

const noop = () => {}

const renderStatus = (progress: ReceivedProgress | null) => {
    return renderWithChakra(
        <PrioritySearchStatus
            progress={progress}
            isStopping={false}
            onStop={noop}
            onCancel={noop}
        />,
    )
}

beforeEach(() => {
    vi.useFakeTimers({ now: START })
})

afterEach(() => {
    vi.useRealTimers()
})

describe("PrioritySearchStatus", () => {
    it("keeps counting seconds between worker messages", () => {
        renderStatus(refining)

        expect(screen.getByText(/Searching… 2m 15s/)).toBeInTheDocument()
        expect(
            screen.getByText(/No better plan for 1m 50s/),
        ).toBeInTheDocument()

        act(() => {
            vi.advanceTimersByTime(1000)
        })

        expect(screen.getByText(/Searching… 2m 16s/)).toBeInTheDocument()
        expect(
            screen.getByText(/No better plan for 1m 51s/),
        ).toBeInTheDocument()

        act(() => {
            vi.advanceTimersByTime(2000)
        })

        expect(screen.getByText(/Searching… 2m 18s/)).toBeInTheDocument()
    })

    it("starts again from each new message", () => {
        const { rerender } = renderStatus(refining)

        act(() => {
            vi.advanceTimersByTime(3000)
        })
        rerender(
            <PrioritySearchStatus
                progress={{
                    ...refining,
                    elapsedMs: 138_600,
                    idleMs: 0,
                    receivedAt: Date.now(),
                }}
                isStopping={false}
                onStop={noop}
                onCancel={noop}
            />,
        )

        expect(screen.getByText(/Searching… 2m 18s/)).toBeInTheDocument()
        expect(screen.getByText(/No better plan for 0s/)).toBeInTheDocument()
    })

    it("waits for the first message before showing a time", () => {
        renderStatus(null)

        expect(
            screen.getByText("Preparing all-board optimization…"),
        ).toBeInTheDocument()
        expect(
            screen.getByRole("button", { name: "Stop & keep" }),
        ).toBeDisabled()
    })
})
