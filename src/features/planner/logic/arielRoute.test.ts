import { describe, expect, it } from "vitest"
import { getStart, keyOf } from "@planner/config/boardConfig"
import { layouts } from "@planner/config/layouts"
import { DEFAULT_ARIEL_STAT_TIERS, type StatTier } from "@planner/config/stats"
import type { ArielSettings } from "@planner/storage/arielSettings"
import { arielMarkedCells, planArielRoute } from "./arielRoute"
import { nodeCost, positionOf, neighborsOf } from "./boardLogic"

const settings = (points: number): ArielSettings => {
    return { points: points, tiers: DEFAULT_ARIEL_STAT_TIERS }
}

describe("planArielRoute", () => {
    it("plans nothing without points", () => {
        expect(planArielRoute(settings(0))).toEqual({
            targetCells: [],
            plannedPath: [],
            plannedCost: 0,
        })
    })

    it("stays within the points, leaves out the start and prices the route", () => {
        const route = planArielRoute(settings(60))
        const start = keyOf(getStart(layouts.ariel))
        let cost = 0

        for (const key of route.plannedPath) {
            cost += nodeCost(layouts.ariel, positionOf(key))
        }

        expect(route.plannedCost).toBeLessThanOrEqual(60)
        expect(route.plannedCost).toBe(cost)
        expect(route.plannedPath).not.toContain(start)
        expect(route.plannedPath.length).toBeGreaterThan(0)
    })

    it("stays connected to the start", () => {
        const route = new Set(planArielRoute(settings(60)).plannedPath)
        const start = getStart(layouts.ariel)
        const seen = new Set<string>()
        const queue = [start]

        while (queue.length > 0) {
            for (const next of neighborsOf(queue.pop() ?? start)) {
                const key = keyOf(next)

                if (route.has(key) && !seen.has(key)) {
                    seen.add(key)
                    queue.push(next)
                }
            }
        }

        expect(seen.size).toBe(route.size)
    })

    it("spends nothing when every stat is ignored", () => {
        const tiers = Object.fromEntries(
            Object.keys(DEFAULT_ARIEL_STAT_TIERS).map((stat) => [
                stat,
                "ignore",
            ]),
        ) as Record<keyof typeof DEFAULT_ARIEL_STAT_TIERS, StatTier>

        expect(planArielRoute({ points: 60, tiers: tiers }).plannedCost).toBe(0)
    })
})

describe("arielMarkedCells", () => {
    it("marks Best and Good nodes of 2 points or more", () => {
        const marked = arielMarkedCells(DEFAULT_ARIEL_STAT_TIERS)
        const layout = layouts.ariel

        expect(marked.best.size).toBeGreaterThan(0)

        for (const key of marked.best) {
            expect(nodeCost(layout, positionOf(key))).toBeGreaterThanOrEqual(2)
            expect(DEFAULT_ARIEL_STAT_TIERS[layout.nodeStats[key]]).toBe("best")
        }

        for (const key of marked.good) {
            expect(DEFAULT_ARIEL_STAT_TIERS[layout.nodeStats[key]]).toBe("good")
        }
    })
})
