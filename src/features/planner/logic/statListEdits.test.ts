import { describe, expect, it } from "vitest"
import {
    DEFAULT_STAT_SETTINGS,
    type StatSettings,
} from "@planner/storage/statPriorities"
import { dropStat, setStatMax } from "./statListEdits"

// Ranks: Attack | Max HP = Defense, with Max MP ignored.
const START: StatSettings = {
    ...DEFAULT_STAT_SETTINGS,
    order: ["attack", "max-hp", "defense"],
    tied: ["defense"],
    ignored: ["max-mp"],
}

describe("dropStat", () => {
    it("joins a rank, worth the same as its stats", () => {
        const moved = dropStat(START, "max-mp", { kind: "rank", index: 0 })

        expect(moved.order).toEqual(["attack", "max-mp", "max-hp", "defense"])
        expect(moved.tied).toEqual(["max-mp", "defense"])
        expect(moved.ignored).toEqual([])
    })

    it("makes a new rank in a gap", () => {
        const moved = dropStat(START, "defense", { kind: "gap", index: 0 })

        expect(moved.order).toEqual(["defense", "attack", "max-hp"])
        expect(moved.tied).toEqual([])
    })

    it("drops a rank left empty", () => {
        const moved = dropStat(START, "attack", { kind: "rank", index: 1 })

        expect(moved.order).toEqual(["max-hp", "defense", "attack"])
        expect(moved.tied).toEqual(["defense", "attack"])
    })

    it("ignores a stat and turns its Max off", () => {
        const start = {
            ...START,
            max: {
                ...START.max,
                attack: { enabled: true, skillAfter: 4, passiveAfter: 3 },
            },
        }
        const moved = dropStat(start, "attack", { kind: "ignored" })

        expect(moved.order).toEqual(["max-hp", "defense"])
        expect(moved.ignored).toEqual(["max-mp", "attack"])
        expect(moved.max.attack).toEqual({
            enabled: false,
            skillAfter: 4,
            passiveAfter: 3,
        })
    })

    it("leaves the settings alone for a rank that doesn't exist", () => {
        expect(dropStat(START, "attack", { kind: "rank", index: 9 })).toBe(
            START,
        )
    })
})

describe("setStatMax", () => {
    it("replaces one stat's Max", () => {
        const max = { enabled: true, skillAfter: 2, passiveAfter: null }

        expect(setStatMax(START, "defense", max).max.defense).toBe(max)
    })
})
