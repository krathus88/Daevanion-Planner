import { describe, expect, it, vi } from "vitest"
import { makeLayout } from "@test/boardFixture"
import { addStatNodes, growByStatValue } from "./statFill"
import { findPlannerPath } from "./plannerLogic"

const layout = makeLayout()
const start = { row: 0, column: 0 }

describe("growByStatValue", () => {
    it("adds what the budget allows, connected to the route", () => {
        const grown = growByStatValue({
            layout: layout,
            route: new Set(["0,0"]),
            cost: 0,
            budget: 2,
            weights: new Map([["1,1", 5]]),
        })

        expect([...grown.path].sort()).toEqual(["0,0", "0,1", "1,1"])
        expect(grown.cost).toBe(2)
    })

    it("skips what it can't afford", () => {
        const grown = growByStatValue({
            layout: layout,
            route: new Set(["0,0"]),
            cost: 0,
            budget: 1,
            weights: new Map([["1,1", 5]]),
        })

        expect(grown.cost).toBe(0)
        expect(grown.path.size).toBe(1)
    })

    it("stops when nothing has value", () => {
        const grown = growByStatValue({
            layout: layout,
            route: new Set(["0,0"]),
            cost: 0,
            budget: 99,
            weights: new Map(),
        })

        expect(grown.cost).toBe(0)
    })

    it("takes the better value per point first", () => {
        // 0,1 pays off at once; 2,2 costs 7 points to reach.
        const grown = growByStatValue({
            layout: layout,
            route: new Set(["0,0"]),
            cost: 0,
            budget: 1,
            weights: new Map([
                ["0,1", 1],
                ["2,2", 1],
            ]),
        })

        expect(grown.path.has("0,1")).toBe(true)
        expect(grown.path.has("2,2")).toBe(false)
    })

    it("keeps growing from an existing cost and doesn't change the route", () => {
        const route = new Set(["0,0", "0,1"])
        const grown = growByStatValue({
            layout: layout,
            route: route,
            cost: 1,
            budget: 2,
            weights: new Map([["1,1", 1]]),
        })

        expect(grown.cost).toBe(2)
        expect(route.size).toBe(2)
    })
})

describe("addStatNodes", () => {
    const findRoute = async (targets: Set<string>) => {
        const result = await findPlannerPath(
            layout,
            start,
            targets,
            { maxMs: 0 },
            {
                onBest: () => {},
                onProgress: () => {},
            },
        )

        if (!result.ok) {
            throw new Error(result.reason)
        }

        return result
    }

    it("adds stat nodes within budget and keeps the targets", async () => {
        const targets = new Set(["0,2"])
        const onImproved = vi.fn()
        const result = await addStatNodes({
            layout: layout,
            start: start,
            targets: targets,
            route: await findRoute(targets),
            budget: 5,
            stats: new Map([["1,1", 1]]),
            weights: new Map([["1,1", 1]]),
            onImproved: onImproved,
        })

        expect(result.path.has("0,2")).toBe(true)
        expect(result.path.has("1,1")).toBe(true)
        expect(result.cost).toBe(5)
        expect(onImproved).toHaveBeenCalledTimes(1)
    })

    it("leaves out what doesn't fit", async () => {
        const targets = new Set(["0,2"])
        const route = await findRoute(targets)
        const result = await addStatNodes({
            layout: layout,
            start: start,
            targets: targets,
            route: route,
            budget: 4,
            stats: new Map([["1,1", 1]]),
            weights: new Map(),
            onImproved: () => {},
        })

        expect(result).toBe(route)
    })
})
