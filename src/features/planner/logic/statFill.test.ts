import { describe, expect, it } from "vitest"
import { makeLayout } from "@test/boardFixture"
import { growByStatValue } from "./statFill"

const layout = makeLayout()

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
