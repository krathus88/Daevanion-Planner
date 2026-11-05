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
    type StatSettings,
} from "./statPriorities"

const CLASS = "gladiator"

const readStored = (stats: unknown) => {
    writeClassSettings(CLASS, "stats", stats)

    return readStatSettings(CLASS)
}

const NO_MAX = { enabled: false, skillAfter: null, passiveAfter: null }

afterEach(() => {
    localStorage.clear()
})

describe("readStatSettings", () => {
    it("has defaults without a save", () => {
        expect(readStatSettings(CLASS)).toBe(DEFAULT_STAT_SETTINGS)
    })

    it("defaults to Attack = Crit maxed, Defense = Max HP, the rest ignored", () => {
        const { max } = DEFAULT_STAT_SETTINGS
        const attack = { enabled: true, skillAfter: 5, passiveAfter: 4 }
        const defense = { enabled: false, skillAfter: 6, passiveAfter: 5 }

        expect(DEFAULT_STAT_SETTINGS.order).toEqual([
            "attack",
            "critical-hit",
            "defense",
            "max-hp",
        ])
        expect(DEFAULT_STAT_SETTINGS.tied).toEqual(["critical-hit", "max-hp"])
        expect(DEFAULT_STAT_SETTINGS.ignored).toEqual([
            "critical-hit-resist",
            "max-mp",
        ])
        expect(max.attack).toEqual(attack)
        expect(max["critical-hit"]).toEqual(attack)
        expect(max.defense).toEqual(defense)
        expect(max["max-hp"]).toEqual(defense)
        expect(max["critical-hit-resist"]).toEqual(NO_MAX)
        expect(max["max-mp"]).toEqual(NO_MAX)
    })

    it("round-trips", () => {
        const settings: StatSettings = {
            order: ["critical-hit", "attack", "defense"],
            tied: ["attack"],
            ignored: ["max-hp", "critical-hit-resist", "max-mp"],
            max: {
                ...DEFAULT_STAT_SETTINGS.max,
                attack: { enabled: true, skillAfter: 4, passiveAfter: null },
            },
        }

        expect(writeStatSettings(CLASS, settings)).toBeNull()
        expect(readStatSettings(CLASS)).toEqual(settings)
    })

    it("drops unknown and repeated stats and ranks missing ones last", () => {
        const settings = readStored({
            order: ["defense", "nonsense", "defense"],
            ignored: ["defense", "max-mp"],
            tied: ["defense", "attack"],
        })

        expect(settings.order).toEqual([
            "defense",
            "attack",
            "critical-hit",
            "max-hp",
            "critical-hit-resist",
        ])
        expect(settings.ignored).toEqual(["max-mp"])
        // The top stat can't be tied.
        expect(settings.tied).toEqual(["attack"])
    })

    it("reads invalid Max ranks as empty and caps them", () => {
        const max = readStored({
            order: ["attack"],
            max: {
                attack: { enabled: true, skillAfter: 0, passiveAfter: 500 },
            },
        }).max

        expect(max.attack).toEqual({
            enabled: true,
            skillAfter: null,
            passiveAfter: 99,
        })
        expect(max.defense).toEqual(NO_MAX)
    })

    it("explains settings that aren't an object", () => {
        writeClassSettings(CLASS, "stats", 5)

        expect(() => {
            return readStatSettings(CLASS)
        }).toThrow("Could not read stat priorities")
    })
})

describe("readStatSettings: old saves", () => {
    it("turns tiers into an order with ties, nothing maxed, dropping spendLeftover", () => {
        const settings = readStored({
            tiers: {
                attack: "okay",
                defense: "best",
                "critical-hit": "best",
                "max-hp": "ignore",
                "critical-hit-resist": "good",
                "max-mp": "ignore",
            },
            spendLeftover: true,
        })

        expect(settings.order).toEqual([
            "critical-hit",
            "defense",
            "critical-hit-resist",
            "attack",
        ])
        expect(settings.tied).toEqual(["defense"])
        expect(settings.ignored).toEqual(["max-hp", "max-mp"])
        expect(settings.max.defense).toEqual(NO_MAX)
        expect(settings).not.toHaveProperty("spendLeftover")
    })

    it("orders by Stat focus ranks and maxes stats with a detour", () => {
        const settings = readStored({
            tiers: {
                attack: "best",
                "critical-hit": "good",
                "max-hp": "okay",
                defense: "okay",
                "critical-hit-resist": "ignore",
                "max-mp": "ignore",
            },
            focus: {
                enabled: true,
                stats: {
                    attack: { skillAfter: 4, passiveAfter: 3, detour: 4 },
                    "critical-hit": {
                        skillAfter: 5,
                        passiveAfter: 4,
                        detour: 1,
                    },
                    "max-hp": { skillAfter: 90, passiveAfter: 90, detour: 0 },
                    defense: { skillAfter: 90, passiveAfter: 90, detour: 0 },
                },
            },
        })

        expect(settings.order).toEqual([
            "attack",
            "critical-hit",
            "max-hp",
            "defense",
        ])
        expect(settings.tied).toEqual(["defense"])
        expect(settings.ignored).toEqual(["critical-hit-resist", "max-mp"])
        expect(settings.max.attack).toEqual({
            enabled: true,
            skillAfter: 4,
            passiveAfter: 3,
        })
        expect(settings.max["critical-hit"]).toEqual({
            enabled: true,
            skillAfter: 5,
            passiveAfter: 4,
        })
        expect(settings.max["max-hp"]).toEqual(NO_MAX)
    })

    it("ignores Stat focus that was turned off", () => {
        const settings = readStored({
            tiers: { attack: "best" },
            focus: {
                enabled: false,
                stats: {
                    attack: { skillAfter: 2, passiveAfter: 2, detour: 3 },
                },
            },
        })

        expect(settings.max.attack).toEqual(NO_MAX)
    })

    it("converts per-tier focus", () => {
        const max = readStored({
            tiers: { attack: "best" },
            focus: {
                enabled: true,
                detour: 2,
                tiers: { best: { passiveAfter: 5, skillAfter: 6 } },
            },
        }).max

        expect(max.attack).toEqual({
            enabled: true,
            skillAfter: 6,
            passiveAfter: 5,
        })
    })

    it("reads the oldest afterRank, for passives only by default", () => {
        const max = readStored({
            tiers: { attack: "best" },
            focus: { enabled: true, tiers: { best: { afterRank: 4 } } },
        }).max

        expect(max.attack.passiveAfter).toBe(4)
        expect(max.attack.skillAfter).toBeNull()
    })

    it("applies afterRank to skills with scope all", () => {
        const max = readStored({
            tiers: { attack: "best" },
            focus: {
                enabled: true,
                scope: "all",
                tiers: { best: { afterRank: 4 } },
            },
        }).max

        expect(max.attack.skillAfter).toBe(4)
    })

    it("reads per-stat Skill/Passive ranks into an order", () => {
        const settings = readStored({
            stats: {
                attack: { skillAfter: 4, passiveAfter: 3, max: true },
                "critical-hit": { skillAfter: 5, passiveAfter: 4, max: false },
                "max-hp": { skillAfter: 90, passiveAfter: 90 },
                defense: { skillAfter: 90, passiveAfter: 90 },
                "critical-hit-resist": { skillAfter: null, passiveAfter: null },
                "max-mp": { skillAfter: null, passiveAfter: null, max: true },
            },
        })

        expect(settings.order).toEqual([
            "attack",
            "critical-hit",
            "max-hp",
            "defense",
        ])
        expect(settings.tied).toEqual(["defense"])
        expect(settings.ignored).toEqual(["critical-hit-resist", "max-mp"])
        expect(settings.max.attack.enabled).toBe(true)
        expect(settings.max["max-mp"].enabled).toBe(false)
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
