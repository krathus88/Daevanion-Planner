import { describe, expect, it } from "vitest"
import { BOARD_IDS } from "@config/boards"
import { neighborsOf, positionOf } from "@planner/logic/boardLogic"
import { validateLayoutBonuses } from "@planner/logic/abilityAssignments"
import { makeLayout } from "@test/boardFixture"
import { getStart, isNode, keyOf } from "./boardConfig"
import { appearanceCost, layouts, POINTS_PER_NODE_TYPE } from "./layouts"
import { routeStatScore, statWeights } from "./stats"

describe("getStart", () => {
    it("finds the start", () => {
        expect(getStart(makeLayout(["#S"]))).toEqual({ row: 0, column: 1 })
    })

    it.each([
        ["no start", ["##"]],
        ["two starts", ["SS"]],
        ["uneven rows", ["S#", "#"]],
        ["no rows", []],
    ])("refuses a board with %s", (_name, grid) => {
        expect(() => {
            return getStart(makeLayout(grid))
        }).toThrow("exactly one start")
    })

    it("refuses an unknown marker", () => {
        expect(() => {
            return getStart(makeLayout(["S?"]))
        }).toThrow("Invalid board cell marker: ?")
    })
})

describe("isNode", () => {
    const layout = makeLayout()

    it("tells nodes from gaps and the outside", () => {
        expect(isNode(layout, { row: 0, column: 1 })).toBe(true)
        expect(isNode(layout, { row: 1, column: 0 })).toBe(false)
        expect(isNode(layout, { row: -1, column: 0 })).toBe(false)
        expect(isNode(layout, { row: 0, column: 99 })).toBe(false)
    })
})

describe("keyOf", () => {
    it("writes row,column", () => {
        expect(keyOf({ row: 2, column: 3 })).toBe("2,3")
    })
})

describe("appearanceCost", () => {
    it("charges by type unless the node has its own cost", () => {
        const node = makeLayout().mainNode

        expect(appearanceCost(node)).toBe(POINTS_PER_NODE_TYPE.basic)
        expect(appearanceCost({ ...node, cost: 4 })).toBe(4)
    })
})

describe.each(BOARD_IDS)("real board %s", (id) => {
    const layout = layouts[id]

    it("has a valid grid", () => {
        expect(() => {
            return getStart(layout)
        }).not.toThrow()
    })

    it("only gives stats and bonuses to fitting nodes", () => {
        expect(() => {
            validateLayoutBonuses(layout, id)
        }).not.toThrow()
    })

    it("can reach every node from the start", () => {
        const seen = new Set([keyOf(getStart(layout))])
        const queue = [...seen]

        while (queue.length > 0) {
            const key = queue.pop() as string

            for (const next of neighborsOf(positionOf(key))) {
                if (isNode(layout, next) && !seen.has(keyOf(next))) {
                    seen.add(keyOf(next))
                    queue.push(keyOf(next))
                }
            }
        }

        let nodes = 0

        for (const row of layout.grid) {
            for (const kind of row) {
                nodes += kind === "." ? 0 : 1
            }
        }

        expect(seen.size).toBe(nodes)
    })
})

describe("statWeights", () => {
    it("weighs each node by its stat and leaves 0 values out", () => {
        const weights = statWeights(
            { "0,0": "attack", "0,1": "defense", "0,2": "max-mp" },
            { attack: 5, defense: 2, "max-mp": 0 },
        )

        expect(weights.has("0,2")).toBe(false)
        expect(weights.get("0,0")).toBe(5)
        expect(weights.get("0,1")).toBe(2)
    })

    it("treats a stat with no value as ignored", () => {
        expect(statWeights({ "0,0": "attack" }, {}).size).toBe(0)
    })
})

describe("routeStatScore", () => {
    it("adds up the path's weights", () => {
        expect(
            routeStatScore(
                ["a", "b", "c"],
                new Map([
                    ["a", 5],
                    ["b", 2],
                ]),
            ),
        ).toBe(7)
    })
})
