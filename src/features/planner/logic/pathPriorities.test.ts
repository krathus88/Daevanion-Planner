import { beforeAll, describe, expect, it } from "vitest"
import { loadClassPreset, type ClassPreset } from "@config/classPresets"
import type { StatType } from "@config/stats/stats"
import { layouts } from "@planner/config/layouts"
import {
    DEFAULT_STAT_SETTINGS,
    type StatSettings,
} from "@planner/storage/statPriorities"
import { boardWants } from "./boardWants"
import { pathPriorities } from "./pathPriorities"

let preset: ClassPreset

beforeAll(async () => {
    preset = await loadClassPreset("gladiator")
})

// The given stats go first, in that order, all maxed.
const maxed = (stats: StatType[]): StatSettings => {
    const max = { ...DEFAULT_STAT_SETTINGS.max }
    for (const stat of stats) {
        max[stat] = { enabled: true, skillAfter: 3, passiveAfter: 3 }
    }

    return {
        ...DEFAULT_STAT_SETTINGS,
        order: [
            ...stats,
            ...DEFAULT_STAT_SETTINGS.order.filter(
                (stat) => !stats.includes(stat),
            ),
        ],
        tied: [],
        max: max,
    }
}

describe("pathPriorities", () => {
    it("has only stat weights and no focus by default", () => {
        const result = pathPriorities({
            classPreset: preset,
            layoutName: "nezekan",
            preferred: new Set(),
            statSettings: DEFAULT_STAT_SETTINGS,
        })

        expect(result.focusGroups).toEqual([])

        for (const [key] of result.weights) {
            expect(layouts.nezekan.nodeStats[key]).toBeDefined()
        }
    })

    it("makes a preferred node outweigh all stats together", () => {
        const want = boardWants(preset, "nezekan")[0]
        const result = pathPriorities({
            classPreset: preset,
            layoutName: "nezekan",
            preferred: new Set([want.id]),
            statSettings: DEFAULT_STAT_SETTINGS,
        })
        const weights = new Map(result.weights)
        let stats = 0

        for (const [key, weight] of weights) {
            if (!want.keys.includes(key)) {
                stats += weight
            }
        }

        expect(weights.get(want.keys[0])).toBeGreaterThan(stats)
    })

    it("builds a group with every node of a maxed stat", () => {
        const want = boardWants(preset, "nezekan")[0]
        const result = pathPriorities({
            classPreset: preset,
            layoutName: "nezekan",
            preferred: new Set([want.id]),
            statSettings: maxed(["attack"]),
        })

        expect(result.focusGroups).toHaveLength(1)

        const [group] = result.focusGroups
        const attackKeys = Object.keys(layouts.nezekan.nodeStats).filter(
            (key) => layouts.nezekan.nodeStats[key] === "attack",
        )

        expect(group.waiting).toEqual(want.keys)
        expect(group.wanted.sort()).toEqual(attackKeys.sort())
    })

    it("orders maxed stats best first and frees all their nodes", () => {
        const result = pathPriorities({
            classPreset: preset,
            layoutName: "nezekan",
            preferred: new Set(),
            statSettings: maxed(["critical-hit", "attack"]),
        })
        const statsOf = (keys: string[]) => {
            return new Set(keys.map((key) => layouts.nezekan.nodeStats[key]))
        }

        expect(
            result.focusGroups.map((group) => statsOf(group.wanted)),
        ).toEqual([new Set(["critical-hit"]), new Set(["attack"])])
        expect(statsOf(result.focusGroups[0].free)).toEqual(
            new Set(["attack", "critical-hit"]),
        )
    })
})
