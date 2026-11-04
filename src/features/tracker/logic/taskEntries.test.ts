import { describe, expect, it } from "vitest"
import type { TrackerTask } from "@tracker/types"
import { clampEntries, readEntries, spendEntry } from "./taskEntries"

const DUNGEON: TrackerTask = {
    id: "d",
    name: "Daily Dungeon",
    reset: "daily",
    cap: 14,
    shared: true,
    recharge: 2,
    bonusCap: 30,
}

describe("readEntries", () => {
    it("starts full", () => {
        expect(readEntries(DUNGEON, undefined, 5)).toEqual({
            base: 14,
            bonus: 0,
        })
    })

    it("adds the recharge for each reset since the save, up to the cap", () => {
        const saved = { period: 5, base: 3, bonus: 4 }

        expect(readEntries(DUNGEON, saved, 5)).toEqual({ base: 3, bonus: 4 })
        expect(readEntries(DUNGEON, saved, 7)).toEqual({ base: 7, bonus: 4 })
        expect(readEntries(DUNGEON, saved, 20)).toEqual({ base: 14, bonus: 4 })
    })

    it("doesn't take entries away for a save from a later period", () => {
        expect(
            readEntries(DUNGEON, { period: 9, base: 3, bonus: 0 }, 8),
        ).toEqual({ base: 3, bonus: 0 })
    })
})

describe("spendEntry", () => {
    it("uses a daily entry first", () => {
        expect(spendEntry({ base: 2, bonus: 5 })).toEqual({ base: 1, bonus: 5 })
    })

    it("then a bonus ticket", () => {
        expect(spendEntry({ base: 0, bonus: 5 })).toEqual({ base: 0, bonus: 4 })
    })

    it("stops at none left", () => {
        expect(spendEntry({ base: 0, bonus: 0 })).toEqual({ base: 0, bonus: 0 })
    })
})

describe("clampEntries", () => {
    it("keeps daily entries to the cap and bonus tickets to theirs", () => {
        expect(clampEntries(DUNGEON, { base: 20, bonus: 40 })).toEqual({
            base: 14,
            bonus: 30,
        })
        expect(clampEntries(DUNGEON, { base: -1, bonus: -1 })).toEqual({
            base: 0,
            bonus: 0,
        })
    })
})
