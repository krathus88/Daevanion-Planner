import { describe, expect, it } from "vitest"
import { STARTER_TASKS } from "@tracker/config/starterTasks"
import type { TrackerTask } from "@tracker/types"
import { getResetPeriods } from "./resetPeriods"
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

    it("adds 3 Shugo keys a day and no refill at the weekly reset", () => {
        const shugo = STARTER_TASKS.find((task) => task.id === "shugo-festival")

        if (!shugo) {
            throw new Error("Shugo Festival missing from the starter tasks")
        }

        // Tuesday noon UTC, then Wednesday noon: one daily reset, which is
        // also the weekly one (Wednesday 07:00 UTC).
        const tuesday = getResetPeriods(Date.UTC(2026, 10, 3, 12))
        const wednesday = getResetPeriods(Date.UTC(2026, 10, 4, 12))
        const saved = { period: tuesday.daily, base: 0, bonus: 0 }

        expect(wednesday.weekly).toBe(tuesday.weekly + 1)
        expect(readEntries(shugo, saved, wednesday.daily).base).toBe(3)
        expect(readEntries(shugo, saved, wednesday.daily + 6).base).toBe(21)
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

describe("Invasion", () => {
    const invasion = STARTER_TASKS.find((task) => task.id === "invasion")

    if (!invasion) {
        throw new Error("Invasion missing from the starter tasks")
    }

    it("adds 1 entry a day, up to 7, with no bonus tickets", () => {
        const saved = { period: 10, base: 4, bonus: 0 }

        expect(readEntries(invasion, saved, 11)).toEqual({ base: 5, bonus: 0 })
        expect(readEntries(invasion, saved, 20)).toEqual({ base: 7, bonus: 0 })
        expect(clampEntries(invasion, { base: 3, bonus: 5 })).toEqual({
            base: 3,
            bonus: 0,
        })
    })
})
