import { beforeAll, describe, expect, it } from "vitest"
import { loadClassPreset, type ClassPreset } from "@config/classPresets"
import { STAT_TYPES } from "@config/stats/stats"
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

const focusOn = (detour: number): StatSettings => {
    return {
        ...DEFAULT_STAT_SETTINGS,
        focus: {
            enabled: true,
            stats: Object.fromEntries(
                STAT_TYPES.map((stat) => [
                    stat,
                    {
                        passiveAfter: null,
                        skillAfter: null,
                        detour: stat === "attack" ? detour : 0,
                    },
                ]),
            ) as StatSettings["focus"]["stats"],
        },
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

    it("builds a group per focused stat, detour not counting the node", () => {
        const want = boardWants(preset, "nezekan")[0]
        const result = pathPriorities({
            classPreset: preset,
            layoutName: "nezekan",
            preferred: new Set([want.id]),
            statSettings: focusOn(2),
        })

        expect(result.focusGroups).toHaveLength(1)

        const [group] = result.focusGroups

        expect(group.detour).toBe(1)
        expect(group.waiting).toEqual(want.keys)

        for (const key of group.wanted) {
            expect(layouts.nezekan.nodeStats[key]).toBe("attack")
        }
    })

    it("has no groups when focus is turned off", () => {
        const settings = focusOn(2)

        expect(
            pathPriorities({
                classPreset: preset,
                layoutName: "nezekan",
                preferred: new Set(),
                statSettings: {
                    ...settings,
                    focus: { ...settings.focus, enabled: false },
                },
            }).focusGroups,
        ).toEqual([])
    })
})
