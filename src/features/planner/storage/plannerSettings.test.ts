// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import { DEFAULT_ARIEL_STAT_TIERS } from "@planner/config/stats"
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
    writeSpecialPriorities,
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
        expect(readArielSettings(CLASS)).toEqual({
            points: 0,
            tiers: DEFAULT_ARIEL_STAT_TIERS,
        })
    })

    it("explains settings that aren't an object", () => {
        writeClassSettings(CLASS, "ariel", 5)

        expect(() => {
            return readArielSettings(CLASS)
        }).toThrow("Could not read Ariel settings")
    })

    it("counts taken nodes", () => {
        const [key, stat] = Object.entries(layouts.ariel.nodeStats)[0]

        writeBoardProgress(CLASS, "ariel", { ...progress, plannedPath: [key] })

        expect(readArielStatNodeCounts(CLASS)[stat].taken).toBe(1)
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
