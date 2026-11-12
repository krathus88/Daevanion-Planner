import type { CompanionStatus } from "@account/game/companionStatus"
import {
    readPlannerLocation,
    writePlannerLocation,
} from "@planner/storage/plannerLocation"
import { renderHook } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { useFollowPlayedClass } from "./useFollowPlayedClass"

const companion = vi.hoisted(() => {
    return { status: { state: "stopped" } as CompanionStatus }
})

vi.mock("@account/hooks/useCompanionStatus", () => {
    return {
        useCompanionStatus: () => {
            return companion.status
        },
    }
})

const play = (name: string, classNumber: number): CompanionStatus => {
    return {
        state: "running",
        character: { name: name, server: 1301, class: classNumber },
    }
}

describe("useFollowPlayedClass", () => {
    beforeEach(() => {
        localStorage.clear()
        writePlannerLocation({ classId: "templar", layout: "nezekan" })
        companion.status = { state: "stopped" }
    })

    it("takes the played character's class, once per character", () => {
        const { rerender } = renderHook(useFollowPlayedClass, {
            initialProps: false,
        })

        companion.status = play("Kryx", 30)
        rerender(false)
        expect(readPlannerLocation().classId).toBe("cleric")

        // Picked by hand: stays until another character is played.
        writePlannerLocation({ classId: "templar", layout: "nezekan" })
        rerender(false)
        expect(readPlannerLocation().classId).toBe("templar")

        companion.status = play("Krathus", 6)
        rerender(false)
        expect(readPlannerLocation().classId).toBe("gladiator")
    })

    it("leaves the class alone on the planner page", () => {
        const { rerender } = renderHook(useFollowPlayedClass, {
            initialProps: true,
        })

        companion.status = play("Kryx", 30)
        rerender(true)
        expect(readPlannerLocation().classId).toBe("templar")

        // Leaving the planner doesn't catch up on a change made there.
        rerender(false)
        expect(readPlannerLocation().classId).toBe("templar")
    })
})
