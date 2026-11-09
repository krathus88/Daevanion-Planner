// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import { ARIEL_PRIORITY_STATS } from "@config/stats/stats"
import {
    DEFAULT_ARIEL_RANK_ORDER,
    DEFAULT_ARIEL_STAT_TIERS,
} from "@planner/config/stats"
import { layouts } from "@planner/config/layouts"
import { readAllocationSnapshot } from "./allocationSnapshot"
import {
    DEFAULT_ARIEL_SETTINGS,
    readArielSettings,
    readArielStatNodeCounts,
    writeArielSettings,
} from "./arielSettings"
import {
    DEFAULT_TOTAL_POINTS,
    writeBoardProgress,
    writePlannerHistory,
    writeSavedPlanners,
} from "./boardStorage"
import { writeClassSettings } from "./classSettings"
import { DEFAULT_RANK_ORDER, readRankOrder, writeRankOrder } from "./rankOrder"
import {
    DEFAULT_SPECIAL_PRIORITIES,
    readSharedSpecialNodeCounts,
    readSpecialPriorities,
    readSpecialSkips,
    writeSpecialPriorities,
    writeSpecialSkips,
} from "./specialPriorities"

const CLASS = "gladiator"

afterEach(() => {
    localStorage.clear()
})

const progress = {
    selectedCells: [],
    availablePoints: 0,
    targetCells: [],
    plannedPath: [] as string[],
    plannedCost: null as number | null,
}

describe("rank order", () => {
    it("defaults, round-trips and repairs bad values", () => {
        expect(readRankOrder(CLASS)).toBe(DEFAULT_RANK_ORDER)

        const order = {
            skill: "more",
            passive: "more",
            special: "less",
        } as const

        expect(writeRankOrder(CLASS, order)).toBeNull()
        expect(readRankOrder(CLASS)).toEqual(order)

        writeClassSettings(CLASS, "rankOrder", { skill: "nonsense" })
        expect(readRankOrder(CLASS)).toEqual(DEFAULT_RANK_ORDER)
    })

    it("explains settings that aren't an object", () => {
        writeClassSettings(CLASS, "rankOrder", 5)

        expect(() => {
            return readRankOrder(CLASS)
        }).toThrow("Could not read same-rank order")
    })
})

describe("special priorities", () => {
    it("defaults, round-trips and repairs bad values", () => {
        expect(readSpecialPriorities(CLASS)).toBe(DEFAULT_SPECIAL_PRIORITIES)

        const priorities = {
            ...DEFAULT_SPECIAL_PRIORITIES,
            "combat-speed": 9,
        }

        expect(writeSpecialPriorities(CLASS, priorities)).toBeNull()
        expect(readSpecialPriorities(CLASS)).toEqual(priorities)

        writeClassSettings(CLASS, "specialPriorities", { "combat-speed": 0 })
        expect(readSpecialPriorities(CLASS)["combat-speed"]).toBe(
            DEFAULT_SPECIAL_PRIORITIES["combat-speed"],
        )
    })

    it("explains settings that aren't an object", () => {
        writeClassSettings(CLASS, "specialPriorities", 5)

        expect(() => {
            return readSpecialPriorities(CLASS)
        }).toThrow("Could not read special node priorities")
    })

    it("skips none by default and keeps only real skips", () => {
        expect(readSpecialSkips(CLASS)).toEqual({})
        expect(writeSpecialSkips(CLASS, { "combat-speed": true })).toBeNull()
        expect(readSpecialSkips(CLASS)).toEqual({ "combat-speed": true })

        writeClassSettings(CLASS, "specialSkips", {
            "damage-boost": "yes",
            nonsense: true,
        })
        expect(readSpecialSkips(CLASS)).toEqual({})

        writeClassSettings(CLASS, "specialSkips", 5)
        expect(() => {
            return readSpecialSkips(CLASS)
        }).toThrow("Could not read skipped special nodes")
    })

    it("counts taken specials", () => {
        const [key, bonus] = Object.entries(
            layouts.nezekan.specialNodeBonuses,
        )[0]

        writeBoardProgress(CLASS, "nezekan", {
            ...progress,
            plannedPath: [key],
        })

        const counts = readSharedSpecialNodeCounts(CLASS, ["nezekan"])

        expect(counts[bonus].taken).toBe(1)
        expect(counts[bonus].total).toBeGreaterThanOrEqual(1)
    })
})

describe("Ariel settings", () => {
    it("defaults, round-trips and repairs bad values", () => {
        expect(readArielSettings(CLASS)).toBe(DEFAULT_ARIEL_SETTINGS)

        const settings = { ...DEFAULT_ARIEL_SETTINGS, points: 30 }

        expect(writeArielSettings(CLASS, settings)).toBeNull()
        expect(readArielSettings(CLASS)).toEqual(settings)

        writeClassSettings(CLASS, "ariel", {
            points: -1,
            tiers: { "pve-attack": "nonsense" },
        })
        expect(readArielSettings(CLASS)).toEqual(DEFAULT_ARIEL_SETTINGS)
    })

    it("starts the default Ignore stats clicked off, with a tier to come back to", () => {
        const settings = DEFAULT_ARIEL_SETTINGS

        expect(settings.ignored.length).toBeGreaterThan(0)
        for (const stat of ARIEL_PRIORITY_STATS) {
            expect(settings.tiers[stat]).not.toBe("ignore")
            expect(settings.ignored.includes(stat)).toBe(
                DEFAULT_ARIEL_STAT_TIERS[stat] === "ignore",
            )
        }
    })

    it("turns an old Ignore tier into a clicked-off stat", () => {
        writeClassSettings(CLASS, "ariel", {
            points: 10,
            tiers: { "pve-attack": "ignore", "pve-evasion": "good" },
        })

        const settings = readArielSettings(CLASS)

        expect(settings.ignored).toContain("pve-attack")
        expect(settings.tiers["pve-attack"]).toBe(
            DEFAULT_ARIEL_STAT_TIERS["pve-attack"],
        )
        // Saved with a tier, so no longer ignored by default.
        expect(settings.ignored).not.toContain("pve-evasion")
        expect(settings.tiers["pve-evasion"]).toBe("good")
    })

    it("keeps the clicked-off stats it saved, dropping unknown ones", () => {
        writeClassSettings(CLASS, "ariel", {
            points: 10,
            ignored: ["pve-attack", "nonsense"],
        })

        expect(readArielSettings(CLASS).ignored).toEqual(["pve-attack"])
    })

    it("keeps a valid same-rank order and repairs the rest", () => {
        writeClassSettings(CLASS, "ariel", {
            points: 10,
            order: {
                "stat-defense": "more",
                "stat-offense": "ignore",
                "special-offense": "nonsense",
            },
        })

        const settings = readArielSettings(CLASS)

        expect(settings.order).toEqual({
            ...DEFAULT_ARIEL_RANK_ORDER,
            "stat-defense": "more",
        })
        // An old Ignore level is a clicked-off group now.
        expect(settings.ignoredGroups).toEqual(["stat-offense"])
    })

    it("keeps the clicked-off groups it saved, dropping unknown ones", () => {
        writeClassSettings(CLASS, "ariel", {
            points: 10,
            ignoredGroups: ["special-defense", "nonsense"],
        })

        expect(readArielSettings(CLASS).ignoredGroups).toEqual([
            "special-defense",
        ])
    })

    it("explains settings that aren't an object", () => {
        writeClassSettings(CLASS, "ariel", 5)

        expect(() => {
            return readArielSettings(CLASS)
        }).toThrow("Could not read Ariel settings")
    })

    it("drops tiers of the old combined stats", () => {
        writeClassSettings(CLASS, "ariel", {
            points: 10,
            tiers: { "pve-attack-defense": "ignore", "pve-attack": "good" },
        })

        const tiers = readArielSettings(CLASS).tiers

        expect(tiers).not.toHaveProperty("pve-attack-defense")
        expect(tiers["pve-attack"]).toBe("good")
    })

    it("counts a taken combined node for both of its stats", () => {
        const [key] = Object.entries(layouts.ariel.nodeStats).find(
            ([, node]) => node === "pve-attack-defense",
        ) ?? [""]

        writeBoardProgress(CLASS, "ariel", { ...progress, plannedPath: [key] })
        const counts = readArielStatNodeCounts(CLASS)

        expect(counts["pve-attack"]).toEqual({ taken: 1, total: 24 })
        expect(counts["pve-defense"]).toEqual({ taken: 1, total: 24 })
        expect(counts["pve-evasion"].taken).toBe(0)
    })
})

describe("readAllocationSnapshot", () => {
    const planner = (id: string, cost: number | null) => {
        return {
            id: id,
            name: id,
            createdAt: 1,
            availablePoints: 1,
            targetCells: [],
            plannedPath: [],
            plannedCost: cost,
        }
    }

    it("has defaults with nothing saved", () => {
        const snapshot = readAllocationSnapshot(CLASS)

        expect(snapshot.allocation.totalPoints).toBe(DEFAULT_TOTAL_POINTS)
        expect(snapshot.selected.nezekan).toBe("")
        expect(snapshot.routeCosts.nezekan).toBe(0)
        expect(snapshot.planners.nezekan).toEqual([])
        expect(snapshot.error).toBeNull()
    })

    it("offers an unsaved route, saved routes and history", () => {
        writeBoardProgress(CLASS, "nezekan", { ...progress, plannedCost: 9 })
        writeSavedPlanners(CLASS, "nezekan", [
            planner("s", 5),
            planner("no-cost", null),
        ])
        writePlannerHistory(CLASS, "nezekan", [planner("h", 6)])

        const snapshot = readAllocationSnapshot(CLASS)

        expect(snapshot.selected.nezekan).toBe("current")
        expect(snapshot.routeCosts.nezekan).toBe(9)
        expect(snapshot.planners.nezekan).toEqual([
            { id: "current", label: "Unsaved route · 9 pts", points: 9 },
            { id: "saved:s", label: "s · 5 pts", points: 5 },
            { id: "history:h", label: "h · 6 pts", points: 6 },
        ])
    })

    it("selects the active planner instead of an unsaved route", () => {
        writeBoardProgress(CLASS, "zikel", {
            ...progress,
            plannedCost: 5,
            activePlanner: { id: "s", name: "s", source: "saved" },
        })
        writeSavedPlanners(CLASS, "zikel", [planner("s", 5)])

        const snapshot = readAllocationSnapshot(CLASS)

        expect(snapshot.selected.zikel).toBe("saved:s")
        expect(snapshot.planners.zikel.map((option) => option.id)).toEqual([
            "saved:s",
        ])
    })

    it("gathers read errors", () => {
        localStorage.setItem(`daevanion:v1:${CLASS}:nezekan:progress`, "{")

        expect(readAllocationSnapshot(CLASS).error).toContain("Could not read")
    })
})
