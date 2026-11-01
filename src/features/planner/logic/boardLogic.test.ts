import { describe, expect, it } from "vitest"
import { makeLayout } from "@test/boardFixture"
import {
    getConnectionCosts,
    neighborsOf,
    nodeCost,
    positionOf,
    selectedNodeCost,
    toggleNodeSelection,
} from "./boardLogic"

const layout = makeLayout()
const start = { row: 0, column: 0 }

describe("positionOf", () => {
    it("reads a row,column key", () => {
        expect(positionOf("3,7")).toEqual({ row: 3, column: 7 })
    })
})

describe("neighborsOf", () => {
    it("lists the four sides", () => {
        expect(neighborsOf({ row: 1, column: 1 })).toEqual([
            { row: 0, column: 1 },
            { row: 2, column: 1 },
            { row: 1, column: 0 },
            { row: 1, column: 2 },
        ])
    })
})

describe("nodeCost", () => {
    it.each([
        ["start", 0, 0, 0],
        ["basic", 0, 1, 1],
        ["skill", 0, 2, 3],
        ["passive", 2, 0, 2],
        ["special", 2, 2, 4],
    ])("charges for a %s node", (_name, row, column, cost) => {
        expect(nodeCost(layout, { row: row, column: column })).toBe(cost)
    })

    it("prefers a node's own cost over its type's", () => {
        const custom = makeLayout(["S#A"], {
            specialNodes: {
                A: {
                    name: "Stat",
                    label: "",
                    backgroundColor: "white",
                    type: "basic",
                    cost: 4,
                },
            },
        })

        expect(nodeCost(custom, { row: 0, column: 2 })).toBe(4)
    })
})

describe("selectedNodeCost", () => {
    it("adds up the selected nodes", () => {
        expect(selectedNodeCost(layout, new Set(["0,1", "0,2"]))).toBe(4)
    })

    it("is 0 with nothing selected", () => {
        expect(selectedNodeCost(layout, new Set())).toBe(0)
    })
})

describe("getConnectionCosts", () => {
    it("costs each node from the start", () => {
        const costs = getConnectionCosts(layout, start, new Set())

        expect(costs.get("0,0")).toBe(0)
        expect(costs.get("0,2")).toBe(4)
        expect(costs.get("2,0")).toBe(5)
        expect(costs.get("2,2")).toBe(7)
    })

    it("counts selected nodes as free to pass through", () => {
        const costs = getConnectionCosts(layout, start, new Set(["0,1", "1,1"]))

        expect(costs.get("2,0")).toBe(3)
    })

    it("leaves unreachable nodes out", () => {
        expect(getConnectionCosts(layout, start, new Set()).has("4,0")).toBe(
            false,
        )
    })
})

describe("toggleNodeSelection", () => {
    it("selects the whole cheapest path to a node", () => {
        const change = toggleNodeSelection(
            layout,
            start,
            new Set(),
            { row: 0, column: 2 },
            10,
        )

        expect([...change.selectedCells].sort()).toEqual(["0,1", "0,2"])
        expect(change.message).toBe("")
    })

    it("extends from nodes already selected", () => {
        const change = toggleNodeSelection(
            layout,
            start,
            new Set(["0,1", "1,1"]),
            { row: 2, column: 1 },
            1,
        )

        expect(change.selectedCells.has("2,1")).toBe(true)
    })

    it("refuses a path over the budget and keeps the selection", () => {
        const selected = new Set<string>()
        const change = toggleNodeSelection(
            layout,
            start,
            selected,
            { row: 0, column: 2 },
            2,
        )

        expect(change.selectedCells).toBe(selected)
        expect(change.message).toBe(
            "That path costs 4 points, but only 2 remain.",
        )
    })

    it("accepts a path that costs exactly the budget", () => {
        const change = toggleNodeSelection(
            layout,
            start,
            new Set(),
            { row: 0, column: 2 },
            4,
        )

        expect(change.selectedCells.size).toBe(2)
    })

    it("won't select the start node", () => {
        const change = toggleNodeSelection(layout, start, new Set(), start, 10)

        expect(change.selectedCells.size).toBe(0)
        expect(change.message).toContain("start node")
    })

    it("reports a node no path reaches", () => {
        const change = toggleNodeSelection(
            layout,
            start,
            new Set(),
            { row: 4, column: 0 },
            10,
        )

        expect(change.message).toBe("There is no connected path to that node.")
    })

    it("drops nodes cut off by a deselect", () => {
        const change = toggleNodeSelection(
            layout,
            start,
            new Set(["0,1", "0,2", "1,1"]),
            { row: 0, column: 1 },
            10,
        )

        expect(change.selectedCells.size).toBe(0)
    })

    it("keeps nodes still connected after a deselect", () => {
        const change = toggleNodeSelection(
            layout,
            start,
            new Set(["0,1", "0,2", "1,1"]),
            { row: 1, column: 1 },
            10,
        )

        expect([...change.selectedCells].sort()).toEqual(["0,1", "0,2"])
    })
})
