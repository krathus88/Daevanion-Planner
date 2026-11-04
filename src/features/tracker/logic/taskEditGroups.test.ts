import { describe, expect, it } from "vitest"
import type { TrackerReset, TrackerTask } from "@tracker/types"
import { getTaskEditGroups } from "./taskEditGroups"
import { getTaskSections } from "./taskSections"

const task = (id: string, reset: TrackerReset, shared = false): TrackerTask => {
    return { id: id, name: id, reset: reset, cap: 1, shared: shared }
}

describe("getTaskEditGroups", () => {
    it("puts the shared tasks before the per character ones, each by reset", () => {
        const groups = getTaskEditGroups(
            getTaskSections([
                task("own-w", "weekly"),
                task("own-d", "daily"),
                task("shared-w", "weekly", true),
                task("shared-d", "daily", true),
            ]),
        )

        expect(groups.map((group) => group.title)).toEqual([
            "Shared by server",
            "Per character",
        ])
        expect(
            groups[0].lists.map((list) => [
                list.label,
                list.tasks.map((item) => item.id),
            ]),
        ).toEqual([
            ["Daily", ["shared-d"]],
            ["Weekly", ["shared-w"]],
        ])
        expect(
            groups[1].lists.map((list) => [
                list.label,
                list.tasks.map((item) => item.id),
            ]),
        ).toEqual([
            ["Daily", ["own-d"]],
            ["Weekly", ["own-w"]],
        ])
    })

    it("leaves out resets with no tasks in a group", () => {
        const groups = getTaskEditGroups(
            getTaskSections([
                task("shared-w", "weekly", true),
                task("own-d", "daily"),
            ]),
        )

        expect(groups[0].lists.map((list) => list.reset)).toEqual(["weekly"])
        expect(groups[1].lists.map((list) => list.reset)).toEqual(["daily"])
    })

    it("leaves out a group with no tasks", () => {
        const groups = getTaskEditGroups(getTaskSections([task("d", "daily")]))

        expect(groups.map((group) => group.id)).toEqual(["own"])
    })
})
