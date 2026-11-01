// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import { layouts } from "@planner/config/layouts"
import { writeBoardProgress } from "./boardStorage"
import { writeClassSettings } from "./classSettings"
import {
    DEFAULT_STAT_SETTINGS,
    readSharedStatNodeCounts,
    readStatSettings,
    writeStatSettings,
} from "./statPriorities"

const CLASS = "gladiator"

const readStored = (stats: unknown) => {
    writeClassSettings(CLASS, "stats", stats)

    return readStatSettings(CLASS)
}

afterEach(() => {
    localStorage.clear()
})

describe("readStatSettings", () => {
    it("has defaults without a save", () => {
        expect(readStatSettings(CLASS)).toBe(DEFAULT_STAT_SETTINGS)
    })

    it("round-trips", () => {
        const settings = {
            ...DEFAULT_STAT_SETTINGS,
            spendLeftover: true,
            tiers: { ...DEFAULT_STAT_SETTINGS.tiers, attack: "okay" as const },
        }

        expect(writeStatSettings(CLASS, settings)).toBeNull()
        expect(readStatSettings(CLASS)).toEqual(settings)
    })

    it("replaces only invalid tiers", () => {
        const tiers = readStored({
            tiers: { attack: "okay", defense: "nonsense" },
        }).tiers

        expect(tiers.attack).toBe("okay")
        expect(tiers.defense).toBe(DEFAULT_STAT_SETTINGS.tiers.defense)
    })

    it("explains settings that aren't an object", () => {
        writeClassSettings(CLASS, "stats", 5)

        expect(() => {
            return readStatSettings(CLASS)
        }).toThrow("Could not read stat priorities")
    })
})

describe("readStatSettings: focus", () => {
    it("defaults to off, with detour 1 on Best stats only", () => {
        const focus = readStored({}).focus

        expect(focus.enabled).toBe(false)
        expect(focus.stats.attack.detour).toBe(1)
        expect(focus.stats.defense.detour).toBe(0)
    })

    it("reads per-stat settings, null meaning never", () => {
        const focus = readStored({
            focus: {
                enabled: true,
                stats: {
                    attack: { passiveAfter: null, skillAfter: 2, detour: 3 },
                },
            },
        }).focus

        expect(focus.enabled).toBe(true)
        expect(focus.stats.attack).toEqual({
            passiveAfter: null,
            skillAfter: 2,
            detour: 3,
        })
    })

    it("falls back on invalid values", () => {
        const stats = readStored({
            focus: {
                stats: { attack: { passiveAfter: 0, detour: -1 } },
            },
        }).focus.stats

        expect(stats.attack.passiveAfter).toBe(3)
        expect(stats.attack.detour).toBe(1)
    })
})

describe("readStatSettings: old saves", () => {
    it("converts per-tier focus, counting the node in the detour", () => {
        const stats = readStored({
            focus: {
                enabled: true,
                detour: 2,
                tiers: { best: { passiveAfter: 5, skillAfter: 6 } },
            },
        }).focus.stats

        expect(stats.attack).toEqual({
            passiveAfter: 5,
            skillAfter: 6,
            detour: 3,
        })
    })

    it("treats a tier that made nothing wait as unfocused", () => {
        const stats = readStored({
            focus: {
                tiers: { best: { passiveAfter: null, skillAfter: null } },
            },
        }).focus.stats

        expect(stats.attack.detour).toBe(0)
    })

    it("leaves ignored stats unfocused", () => {
        const stats = readStored({
            tiers: { attack: "ignore" },
            focus: { tiers: { best: { passiveAfter: 5 } } },
        }).focus.stats

        expect(stats.attack).toEqual({
            passiveAfter: null,
            skillAfter: null,
            detour: 0,
        })
    })

    it("reads the oldest afterRank, for passives only by default", () => {
        const stats = readStored({
            focus: { tiers: { best: { afterRank: 4 } } },
        }).focus.stats

        expect(stats.attack.passiveAfter).toBe(4)
        expect(stats.attack.skillAfter).toBeNull()
    })

    it("applies afterRank to skills with scope all", () => {
        const stats = readStored({
            focus: { scope: "all", tiers: { best: { afterRank: 4 } } },
        }).focus.stats

        expect(stats.attack.skillAfter).toBe(4)
    })
})

describe("readSharedStatNodeCounts", () => {
    it("counts taken nodes out of each stat's total", () => {
        const [key, stat] = Object.entries(layouts.nezekan.nodeStats)[0]

        writeBoardProgress(CLASS, "nezekan", {
            selectedCells: [],
            availablePoints: 0,
            targetCells: [],
            plannedPath: [key, "5,5"],
            plannedCost: 0,
        })

        const counts = readSharedStatNodeCounts(CLASS, ["nezekan"])
        const total = Object.values(layouts.nezekan.nodeStats).filter(
            (other) => other === stat,
        ).length

        expect(counts[stat]).toEqual({ taken: 1, total: total })
    })
})
