import { describe, expect, it, vi } from "vitest"
import { getStart, keyOf } from "@planner/config/boardConfig"
import { layouts } from "@planner/config/layouts"
import {
    DEFAULT_ARIEL_RANK_ORDER,
    DEFAULT_ARIEL_STAT_TIERS,
    statWeights,
} from "@planner/config/stats"
import { makeLayout } from "@test/boardFixture"
import { arielNodeValues } from "./arielRoute"
import { neighborsOf, nodeCost, positionOf } from "./boardLogic"
import type { SearchLimit } from "./plannerLogic"
import { growByStatValue } from "./statFill"
import { searchStatFill, type StatFillRoute } from "./statFillSearch"

// 0,0 pays 3 at once; 0,3 pays 5 but needs the worthless 0,2 first. With
// 2 points greedy takes 0,0 (3 a point), and then can't reach 0,3.
const trap = makeLayout(["#S##"])
const trapWeights = new Map([
    ["0,0", 3],
    ["0,3", 5],
])

// Ends after the given number of tries.
const tries = (count: number): SearchLimit => {
    let left = count
    return {
        maxMs: Number.POSITIVE_INFINITY,
        shouldStop: () => {
            left -= 1
            return left < 0
        },
    }
}

// Same numbers every run.
const seeded = (seed = 7) => {
    let state = seed
    return () => {
        state = (state * 1103515245 + 12345) % 2 ** 31
        return state / 2 ** 31
    }
}

const searchTrap = (
    options: Partial<Parameters<typeof searchStatFill>[0]> = {},
) => {
    const found: StatFillRoute[] = []
    const result = searchStatFill({
        layout: trap,
        startKey: "0,1",
        kept: new Set(["0,1"]),
        route: new Set(["0,1"]),
        budget: 2,
        weights: trapWeights,
        limit: tries(200),
        random: seeded(),
        onProgress: () => {},
        onBest: (best) => {
            found.push(best)
        },
        ...options,
    })

    return { result: result, found: found }
}

const isConnected = (path: ReadonlySet<string>, startKey: string) => {
    const seen = new Set([startKey])
    const queue = [startKey]
    while (queue.length > 0) {
        const key = queue.pop() ?? startKey
        for (const neighbor of neighborsOf(positionOf(key))) {
            const next = keyOf(neighbor)
            if (path.has(next) && !seen.has(next)) {
                seen.add(next)
                queue.push(next)
            }
        }
    }

    return seen.size === path.size
}

describe("searchStatFill", () => {
    it("shows the greedy fill first", async () => {
        const { result, found } = searchTrap({ limit: tries(0) })

        expect(await result).toEqual({
            path: new Set(["0,1", "0,0"]),
            cost: 1,
        })
        expect(found).toEqual([{ path: new Set(["0,1", "0,0"]), cost: 1 }])
    })

    it("finds what greedy misses", async () => {
        const { result, found } = searchTrap()

        expect([...(await result).path].sort()).toEqual(["0,1", "0,2", "0,3"])
        expect(found).toHaveLength(2)
    })

    it("never drops a kept node, even for a better route", async () => {
        const { result } = searchTrap({
            kept: new Set(["0,1", "0,0"]),
            route: new Set(["0,1", "0,0"]),
        })

        expect([...(await result).path].sort()).toEqual(["0,0", "0,1"])
    })

    it("ends once no better route turns up for the stall window", async () => {
        let now = 0
        const clock = vi.spyOn(performance, "now").mockImplementation(() => {
            now += 10
            return now
        })
        const { result } = searchTrap({
            limit: { maxMs: Number.POSITIVE_INFINITY, stallMs: 1000 },
        })

        await result
        clock.mockRestore()

        expect(now).toBeLessThan(5000)
    })

    it("reports progress when it ends", async () => {
        const onProgress = vi.fn()
        await searchTrap({ limit: tries(3), onProgress: onProgress }).result

        expect(onProgress).toHaveBeenLastCalledWith(
            expect.objectContaining({ attempts: 4 }),
        )
    })

    it("beats greedy on Ariel at 120 points, connected and within budget", async () => {
        const layout = layouts.ariel
        const startKey = keyOf(getStart(layout))
        const weights = statWeights(
            layout.nodeStats,
            arielNodeValues(DEFAULT_ARIEL_STAT_TIERS, DEFAULT_ARIEL_RANK_ORDER),
        )
        const value = (path: ReadonlySet<string>) => {
            let total = 0n
            for (const key of path) {
                total += BigInt(
                    Math.round(
                        (weights.get(key) ?? 0) *
                            nodeCost(layout, positionOf(key)),
                    ),
                )
            }

            return total
        }
        const greedy = growByStatValue({
            layout: layout,
            route: new Set([startKey]),
            cost: 0,
            budget: 120,
            weights: weights,
        })

        const best = await searchStatFill({
            layout: layout,
            startKey: startKey,
            kept: new Set([startKey]),
            route: new Set([startKey]),
            budget: 120,
            weights: weights,
            limit: tries(300),
            random: seeded(2),
            onProgress: () => {},
            onBest: () => {},
        })

        expect(best.cost).toBeLessThanOrEqual(120)
        expect(isConnected(best.path, startKey)).toBe(true)
        expect(value(best.path)).toBeGreaterThan(value(greedy.path))
    })
})
