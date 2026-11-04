import { describe, expect, it } from "vitest"
import type { TrackerReset, TrackerTask } from "@tracker/types"
import { getTaskSections } from "./taskSections"

const task = (id: string, reset: TrackerReset, shared = false): TrackerTask => {
    return { id: id, name: id, reset: reset, cap: 1, shared: shared }
}

describe("getTaskSections", () => {
    it("puts dailies before weeklies, keeping the list's order", () => {
        const sections = getTaskSections([
            task("w", "weekly"),
            task("d1", "daily"),
            task("d2", "daily"),
        ])

        expect(sections.map((section) => section.label)).toEqual([
            "Daily",
            "Weekly",
        ])
        expect(sections[0].tasks.map((item) => item.id)).toEqual(["d1", "d2"])
    })

    it("keeps shared tasks apart", () => {
        const [daily] = getTaskSections([
            task("shared", "daily", true),
            task("own", "daily"),
        ])

        expect(daily.tasks.map((item) => item.id)).toEqual(["own"])
        expect(daily.sharedTasks.map((item) => item.id)).toEqual(["shared"])
    })

    it("keeps a section with only shared tasks", () => {
        const sections = getTaskSections([task("s", "weekly", true)])

        expect(sections).toHaveLength(1)
        expect(sections[0].tasks).toEqual([])
    })

    it("leaves out a reset with no tasks", () => {
        const sections = getTaskSections([task("w", "weekly")])

        expect(sections.map((section) => section.reset)).toEqual(["weekly"])
    })
})
