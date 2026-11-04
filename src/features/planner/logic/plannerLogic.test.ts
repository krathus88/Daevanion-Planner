import { describe, expect, it, vi } from "vitest"
import { BOARD_IDS } from "@config/boards"
import { getStart, isNode } from "@planner/config/boardConfig"
import { layouts } from "@planner/config/layouts"
import { makeLayout } from "@test/boardFixture"
import { neighborsOf, positionOf } from "./boardLogic"
import { findPlannerPath, formatPlannerDuration } from "./plannerLogic"

const layout = makeLayout()
const start = { row: 0, column: 0 }

const makeCallbacks = () => {
    return { onProgress: vi.fn(), onBest: vi.fn() }
}

describe("findPlannerPath", () => {
    it("asks for a target when there are none", async () => {
        const result = await findPlannerPath(
            layout,
            start,
            new Set(),
            { maxMs: 0 },
            makeCallbacks(),
        )

        expect(result).toEqual({
            ok: false,
            reason: "Select at least one node to plan a route.",
        })
    })

    it("doesn't count the start as a target", async () => {
        const result = await findPlannerPath(
            layout,
            start,
            new Set(["0,0"]),
            { maxMs: 0 },
            makeCallbacks(),
        )

        expect(result).toEqual({
            ok: false,
            reason: "Select at least one node other than the start.",
        })
    })

    it("reports targets it can't connect", async () => {
        const result = await findPlannerPath(
            layout,
            start,
            new Set(["4,0"]),
            { maxMs: 0 },
            makeCallbacks(),
        )

        expect(result.ok).toBe(false)
    })

    it("routes to one target and prices the route", async () => {
        const result = await findPlannerPath(
            layout,
            start,
            new Set(["2,2"]),
            { maxMs: 0 },
            makeCallbacks(),
        )

        expect(result).toMatchObject({ ok: true, cost: 7 })
        expect(result.ok && [...result.path].sort()).toEqual([
            "0,1",
            "1,1",
            "2,1",
            "2,2",
        ])
    })

    it("shares the trunk between targets", async () => {
        const result = await findPlannerPath(
            layout,
            start,
            new Set(["2,0", "2,2"]),
            { maxMs: 20 },
            makeCallbacks(),
        )

        expect(result).toMatchObject({ ok: true, cost: 9 })
    })

    it("uses stat weights only to break cost ties", async () => {
        // Two routes of equal cost to the far corner.
        const ring = makeLayout(["S##", "#.#", "###"])
        const statWeights = new Map([
            ["1,0", 5],
            ["2,0", 5],
            ["2,1", 5],
        ])
        const result = await findPlannerPath(
            ring,
            start,
            new Set(["2,2"]),
            { maxMs: 20 },
            makeCallbacks(),
            statWeights,
        )

        expect(result).toMatchObject({ ok: true, cost: 4, statScore: 15 })
    })

    it("reports every improvement and the final progress", async () => {
        const callbacks = makeCallbacks()

        await findPlannerPath(
            layout,
            start,
            new Set(["0,2"]),
            { maxMs: 0 },
            callbacks,
        )

        expect(callbacks.onBest).toHaveBeenCalled()
        expect(callbacks.onProgress).toHaveBeenCalled()
    })

    it("stops once a stall passes without a better route", async () => {
        const callbacks = makeCallbacks()

        const result = await findPlannerPath(
            layout,
            start,
            new Set(["2,0", "2,2"]),
            { maxMs: 60_000, stallMs: 0 },
            callbacks,
        )

        expect(result.ok).toBe(true)
        expect(callbacks.onProgress).toHaveBeenLastCalledWith(
            expect.objectContaining({ attempts: 1 }),
        )
    })

    it("stops when asked to and keeps what it found", async () => {
        const callbacks = makeCallbacks()

        const result = await findPlannerPath(
            layout,
            start,
            new Set(["2,2"]),
            { maxMs: 60_000, shouldStop: () => true },
            callbacks,
        )

        expect(result).toMatchObject({ ok: true, cost: 7 })
        expect(callbacks.onProgress).toHaveBeenLastCalledWith(
            expect.objectContaining({ attempts: 1 }),
        )
    })

    it("reports how long it has gone without a better route", async () => {
        let now = 0
        vi.spyOn(performance, "now").mockImplementation(() => {
            now += 100

            return now
        })
        const callbacks = makeCallbacks()

        await findPlannerPath(
            layout,
            start,
            new Set(["2,2"]),
            { maxMs: 2000 },
            callbacks,
        )
        vi.restoreAllMocks()
        const last = callbacks.onProgress.mock.lastCall?.[0]

        expect(last.idleMs).toBeGreaterThan(0)
        expect(last.idleMs).toBeLessThan(last.elapsedMs)
    })

    it.each(BOARD_IDS)(
        "plans a connected route on the real %s board",
        async (id) => {
            const board = layouts[id]
            const boardStart = getStart(board)
            const nodes: string[] = []

            for (let row = 0; row < board.grid.length; row++) {
                for (
                    let column = 0;
                    column < board.grid[row].length;
                    column++
                ) {
                    if (
                        board.grid[row][column] !== "." &&
                        board.grid[row][column] !== "S"
                    ) {
                        nodes.push(`${row},${column}`)
                    }
                }
            }

            const targets = new Set([
                nodes[0],
                nodes[Math.floor(nodes.length / 2)],
                nodes[nodes.length - 1],
            ])
            const result = await findPlannerPath(
                board,
                boardStart,
                targets,
                { maxMs: 0 },
                makeCallbacks(),
            )

            if (!result.ok) {
                throw new Error(result.reason)
            }

            for (const target of targets) {
                expect(result.path.has(target)).toBe(true)
            }

            // Walking from the start over the route reaches all of it.
            const seen = new Set<string>()
            const queue = [boardStart]

            while (queue.length > 0) {
                const current = queue.pop()

                for (const next of neighborsOf(current ?? boardStart)) {
                    const key = `${next.row},${next.column}`

                    if (
                        isNode(board, next) &&
                        result.path.has(key) &&
                        !seen.has(key)
                    ) {
                        seen.add(key)
                        queue.push(positionOf(key))
                    }
                }
            }

            expect(seen.size).toBe(result.path.size)
        },
    )
})

describe("formatPlannerDuration", () => {
    it.each([
        [0, "1 ms"],
        [12.2, "13 ms"],
        [999, "999 ms"],
        [1000, "1.0 sec"],
        [2540, "2.5 sec"],
        [59_900, "59.9 sec"],
        [60_000, "1m"],
        [312_000, "5m 12s"],
    ])("formats %d ms", (milliseconds, text) => {
        expect(formatPlannerDuration(milliseconds)).toBe(text)
    })
})
