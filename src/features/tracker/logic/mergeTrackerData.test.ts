import { describe, expect, it } from "vitest"
import { mergeTrackerData } from "./mergeTrackerData"

const aria = { id: "a", name: "Aria", classId: "cleric", server: "siel" }
const bran = { id: "b", name: "Bran", classId: "templar", server: "zikel" }
const task = { id: "t", name: "Task", reset: "daily", cap: 5, shared: false }

describe("mergeTrackerData", () => {
    it("keeps characters from both sides, the newer side's copy first", () => {
        const merged = mergeTrackerData(
            { characters: [{ ...aria, name: "Aria 2" }] },
            { characters: [bran, aria] },
        )

        expect(merged.characters).toEqual([{ ...aria, name: "Aria 2" }, bran])
    })

    it("uses whichever side has its own task list", () => {
        expect(
            mergeTrackerData({ tasks: null }, { tasks: [task] }).tasks,
        ).toEqual([task])
        expect(mergeTrackerData({ tasks: null }, { tasks: null }).tasks).toBe(
            null,
        )
    })

    it("merges two task lists by id", () => {
        const other = { ...task, id: "u", name: "Other" }
        const merged = mergeTrackerData(
            { tasks: [{ ...task, cap: 3 }] },
            { tasks: [task, other] },
        )

        expect(merged.tasks).toEqual([{ ...task, cap: 3 }, other])
    })

    it("keeps the later period, then the higher count", () => {
        const merged = mergeTrackerData(
            {
                counts: {
                    a: {
                        later: { period: 2, count: 1 },
                        higher: { period: 2, count: 1 },
                    },
                },
            },
            {
                counts: {
                    a: {
                        later: { period: 3, count: 0 },
                        higher: { period: 2, count: 4 },
                    },
                    b: { t: { period: 1, count: 1 } },
                },
            },
        )

        expect(merged.counts).toEqual({
            a: {
                later: { period: 3, count: 0 },
                higher: { period: 2, count: 4 },
            },
            b: { t: { period: 1, count: 1 } },
        })
    })

    it("keeps the later entries, or the newer side's in the same period", () => {
        const merged = mergeTrackerData(
            {
                entries: {
                    s: {
                        later: { period: 2, base: 5, bonus: 0 },
                        same: { period: 3, base: 1, bonus: 0 },
                    },
                },
            },
            {
                entries: {
                    s: {
                        later: { period: 4, base: 9, bonus: 2 },
                        same: { period: 3, base: 8, bonus: 0 },
                    },
                },
            },
        )

        expect(merged.entries).toEqual({
            s: {
                later: { period: 4, base: 9, bonus: 2 },
                same: { period: 3, base: 1, bonus: 0 },
            },
        })
    })

    it("takes minimized cards from the newer side", () => {
        expect(
            mergeTrackerData({ minimized: ["a"] }, { minimized: ["b"] })
                .minimized,
        ).toEqual(["a"])
    })

    it("drops what doesn't parse", () => {
        expect(mergeTrackerData("broken", null)).toEqual({
            characters: [],
            tasks: null,
            counts: {},
            entries: {},
            minimized: [],
            ignored: {},
        })
    })
})
