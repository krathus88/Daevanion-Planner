import { describe, expect, it } from "vitest"
import { MAX_PLANNER_HISTORY } from "@planner/storage/boardStorage"
import { STARTER_IDS } from "@tracker/logic/presetTasks"
import { mergeSyncedValue } from "./mergeSyncedValue"
import { PETS_KEY, TIMERS_KEY, TRACKER_KEY } from "./syncedKeys"

const SAVED = "daevanion:v1:gladiator:nezekan:saved-boards"
const HISTORY = "daevanion:v1:gladiator:nezekan:planner-history"

describe("mergeSyncedValue: saved lists", () => {
    it("keeps entries from both sides, newest first", () => {
        expect(
            mergeSyncedValue(
                SAVED,
                [{ id: "a", createdAt: 1 }],
                [{ id: "b", createdAt: 2 }],
                true,
            ),
        ).toEqual([
            { id: "b", createdAt: 2 },
            { id: "a", createdAt: 1 },
        ])
    })

    it("keeps the newer side's copy of a shared entry", () => {
        const device = [{ id: "a", createdAt: 1, name: "device" }]
        const account = [{ id: "a", createdAt: 1, name: "account" }]

        expect(mergeSyncedValue(SAVED, device, account, true)).toEqual(device)
        expect(mergeSyncedValue(SAVED, device, account, false)).toEqual(account)
    })

    it("drops malformed entries", () => {
        expect(
            mergeSyncedValue(SAVED, [{ id: 1 }, null, "x"], [], true),
        ).toEqual([])
    })

    it("caps the planner history", () => {
        const entries = Array.from(
            { length: MAX_PLANNER_HISTORY + 5 },
            (_, index) => {
                return { id: `${index}`, createdAt: index }
            },
        )
        const merged = mergeSyncedValue(HISTORY, entries, [], true) as {
            createdAt: number
        }[]

        expect(merged).toHaveLength(MAX_PLANNER_HISTORY)
        expect(merged[0].createdAt).toBe(MAX_PLANNER_HISTORY + 4)
    })

    it("falls back to the newer side when one isn't a list", () => {
        expect(mergeSyncedValue(SAVED, "broken", [], true)).toBe("broken")
    })
})

describe("mergeSyncedValue: pets", () => {
    it("keeps each pet's higher level and souls", () => {
        expect(
            mergeSyncedValue(
                PETS_KEY,
                { levels: { 1: 3, 2: 1 }, souls: { 2: 10 } },
                { levels: { 1: 1, 2: 2, 3: 1 }, souls: { 2: 40, 3: 6 } },
                true,
            ),
        ).toEqual({
            levels: { 1: 3, 2: 2, 3: 1 },
            souls: { 2: 40, 3: 6 },
        })
    })

    it("takes other fields from the newer side", () => {
        const merged = mergeSyncedValue(
            PETS_KEY,
            { levels: {}, hiddenLevels: [1] },
            { levels: {}, hiddenLevels: [2] },
            false,
        )

        expect(merged).toMatchObject({ hiddenLevels: [2] })
    })

    it("copes with a save from before souls existed", () => {
        expect(
            mergeSyncedValue(
                PETS_KEY,
                { levels: { 1: 1 } },
                { levels: {}, souls: { 1: 5 } },
                true,
            ),
        ).toEqual({ levels: { 1: 1 }, souls: { 1: 5 } })
    })
})

describe("mergeSyncedValue: tracker", () => {
    it("keeps both sides' characters and the later counts", () => {
        expect(
            mergeSyncedValue(
                TRACKER_KEY,
                {
                    characters: [{ id: "a", name: "A", classId: "cleric" }],
                    presets: STARTER_IDS,
                    counts: { a: { t: { period: 2, count: 1 } } },
                },
                {
                    characters: [{ id: "b", name: "B", classId: "ranger" }],
                    presets: STARTER_IDS,
                    counts: { a: { t: { period: 3, count: 0 } } },
                },
                true,
            ),
        ).toEqual({
            characters: [
                { id: "a", name: "A", classId: "cleric", server: "siel" },
                { id: "b", name: "B", classId: "ranger", server: "siel" },
            ],
            tasks: null,
            presets: STARTER_IDS,
            counts: { a: { t: { period: 3, count: 0 } } },
            entries: {},
            minimized: [],
            goalsOpen: [],
            ignored: {},
            energy: {},
            notes: {},
            membership: true,
        })
    })
})

describe("mergeSyncedValue: anything else", () => {
    it("takes the side edited last", () => {
        expect(mergeSyncedValue(TIMERS_KEY, { a: 1 }, { a: 2 }, true)).toEqual({
            a: 1,
        })
        expect(mergeSyncedValue(TIMERS_KEY, { a: 1 }, { a: 2 }, false)).toEqual(
            { a: 2 },
        )
    })
})
