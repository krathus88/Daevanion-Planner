import { describe, expect, it } from "vitest"
import { getTaskTitle } from "./taskTitle"

describe("getTaskTitle", () => {
    it("adds the subtitle in brackets, when there is one", () => {
        const task = {
            id: "t",
            name: "Arena",
            reset: "weekly" as const,
            cap: 30,
            shared: false,
        }

        expect(getTaskTitle(task)).toBe("Arena")
        expect(getTaskTitle({ ...task, subtitle: "Wins" })).toBe("Arena (Wins)")
    })
})
