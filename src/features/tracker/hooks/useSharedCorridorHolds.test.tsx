import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { readTrackerData } from "@tracker/storage/trackerData"
import type { TrackerData } from "@tracker/types"
import { useSharedCorridorHolds } from "./useSharedCorridorHolds"

const shared = vi.hoisted(() => {
    return {
        holds: [] as unknown[],
        subscribed: 0,
        applied: [] as unknown[],
    }
})

vi.mock("@tracker/shared/sharedCorridorHolds", () => {
    return {
        readSharedCorridorHolds: () => shared.holds,
        subscribeToSharedCorridorHolds: () => {
            shared.subscribed++

            return () => {}
        },
    }
})

vi.mock("@account/game/gameSync", () => {
    return {
        applySharedCorridorHolds: (holds: unknown) => {
            shared.applied.push(holds)
        },
    }
})

const HOLDS = [{ server: 1301, siegeEnd: 1, artifacts: { "1001": 1 } }]

const withCharacter = (): TrackerData => {
    return {
        ...readTrackerData(),
        characters: [
            { id: "a", name: "Aria", classId: "cleric", server: "siel" },
        ],
    }
}

beforeEach(() => {
    shared.holds = HOLDS
    shared.subscribed = 0
    shared.applied = []
})

describe("useSharedCorridorHolds", () => {
    it("applies the shared holdings, and again when the data changes", () => {
        const { rerender } = renderHook(useSharedCorridorHolds, {
            initialProps: withCharacter(),
        })

        expect(shared.subscribed).toBe(1)
        expect(shared.applied).toEqual([HOLDS])

        rerender(withCharacter())

        expect(shared.applied).toEqual([HOLDS, HOLDS])
    })

    it("watches nothing without characters", () => {
        renderHook(useSharedCorridorHolds, {
            initialProps: { ...readTrackerData(), characters: [] },
        })

        expect(shared.subscribed).toBe(0)
        expect(shared.applied).toEqual([])
    })
})
