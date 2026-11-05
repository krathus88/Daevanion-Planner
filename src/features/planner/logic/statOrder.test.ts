import { describe, expect, it } from "vitest"
import { DEFAULT_STAT_SETTINGS } from "@planner/storage/statPriorities"
import { maxedStats, statGroups, statValues } from "./statOrder"

describe("statGroups", () => {
    it("joins tied stats with the one above", () => {
        expect(
            statGroups({
                order: ["attack", "critical-hit", "max-hp", "defense"],
                tied: ["defense"],
            }),
        ).toEqual([["attack"], ["critical-hit"], ["max-hp", "defense"]])
    })
})

describe("statValues", () => {
    it("makes one better node outweigh many worse ones, ties equal", () => {
        const values = statValues({
            order: ["attack", "max-hp", "defense"],
            tied: ["defense"],
        })

        expect(values["max-hp"]).toBe(values.defense)
        expect(values.attack ?? 0).toBeGreaterThan((values.defense ?? 0) * 100)
    })

    it("leaves stats outside the order out", () => {
        expect(
            Object.keys(statValues({ order: ["attack"], tied: [] })),
        ).toEqual(["attack"])
    })
})

describe("maxedStats", () => {
    it("lists maxed stats in order, never ignored ones", () => {
        const max = {
            ...DEFAULT_STAT_SETTINGS.max,
            attack: { enabled: true, skillAfter: 4, passiveAfter: 3 },
            "critical-hit": { enabled: true, skillAfter: 5, passiveAfter: 4 },
            "max-mp": { enabled: true, skillAfter: null, passiveAfter: null },
        }

        expect(
            maxedStats({
                order: ["critical-hit", "defense", "attack"],
                max: max,
            }),
        ).toEqual(["critical-hit", "attack"])
    })
})
