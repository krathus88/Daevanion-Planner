import { describe, expect, it } from "vitest"
import { STARTER_IDS } from "./presetTasks"
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
            mergeTrackerData(
                { tasks: null, presets: STARTER_IDS },
                { tasks: [task], presets: STARTER_IDS },
            ).tasks,
        ).toEqual([task])
        expect(
            mergeTrackerData(
                { tasks: null, presets: STARTER_IDS },
                { tasks: null, presets: STARTER_IDS },
            ).tasks,
        ).toBe(null)
    })

    it("merges two task lists by id", () => {
        const other = { ...task, id: "u", name: "Other" }
        const merged = mergeTrackerData(
            { tasks: [{ ...task, cap: 3 }], presets: STARTER_IDS },
            { tasks: [task, other], presets: STARTER_IDS },
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
            presets: STARTER_IDS,
            counts: {},
            entries: {},
            minimized: [],
            ignored: {},
            energy: {},
            notes: {},
            membership: true,
        })
    })

    it("merges Odyle Energy per character, the later recharge first", () => {
        const merged = mergeTrackerData(
            {
                energy: {
                    a: { period: 5, base: 100, bonus: 0 },
                    b: { period: 5, base: 200, bonus: 0 },
                },
            },
            {
                energy: {
                    a: { period: 6, base: 50, bonus: 0 },
                    b: { period: 5, base: 300, bonus: 0 },
                    c: { period: 1, base: 10, bonus: 0 },
                },
            },
        )

        expect(merged.energy).toEqual({
            a: { period: 6, base: 50, bonus: 0 },
            b: { period: 5, base: 200, bonus: 0 },
            c: { period: 1, base: 10, bonus: 0 },
        })
    })

    it("takes each character's note from the newer side", () => {
        const merged = mergeTrackerData(
            { notes: { a: { short: "New", long: "" } } },
            {
                notes: {
                    a: { short: "Old", long: "Old details" },
                    b: { short: "Bran", long: "" },
                },
            },
        )

        expect(merged.notes).toEqual({
            a: { short: "New", long: "" },
            b: { short: "Bran", long: "" },
        })
    })

    it("takes the membership from the newer side", () => {
        expect(mergeTrackerData({ membership: false }, {}).membership).toBe(
            false,
        )
        expect(mergeTrackerData({}, { membership: false }).membership).toBe(
            true,
        )
    })
})
