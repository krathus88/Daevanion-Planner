import { keyOf } from "@planner/config/boardConfig"
import type { BoardLayout } from "@planner/config/layouts"
import { neighborsOf, nodeCost, positionOf } from "./boardLogic"
import type { PlannerProgress, SearchLimit } from "./plannerLogic"
import { growByStatValue } from "./statFill"

export type StatFillRoute = { path: Set<string>; cost: number }

const YIELD_EVERY_MS = 25
const PROGRESS_EVERY_MS = 500
// A try drops up to this many end nodes before growing the route again.
const MAX_DROPPED = 25
// Then it drops a few more and regrows them without noise, to tidy up.
const MAX_POLISH_DROPPED = 4
// How far the noise may push an option's value either way, at most.
const MAX_NOISE = 0.75

// Exact, since tier values are far apart and a float sum would lose the
// lower tiers.
const nodeValue = (
    layout: BoardLayout,
    weights: ReadonlyMap<string, number>,
    key: string,
) => {
    const weight = weights.get(key) ?? 0
    return BigInt(Math.round(weight * nodeCost(layout, positionOf(key))))
}

const routeValue = (
    layout: BoardLayout,
    weights: ReadonlyMap<string, number>,
    path: ReadonlySet<string>,
) => {
    let value = 0n
    for (const key of path) {
        value += nodeValue(layout, weights, key)
    }

    return value
}

const routeCost = (
    layout: BoardLayout,
    path: ReadonlySet<string>,
    startKey: string,
) => {
    let cost = 0
    for (const key of path) {
        if (key !== startKey) {
            cost += nodeCost(layout, positionOf(key))
        }
    }

    return cost
}

// Removes `count` random end nodes (one route neighbor), so the route stays
// connected. Kept nodes are never removed.
const dropEnds = (
    path: Set<string>,
    kept: ReadonlySet<string>,
    count: number,
    random: () => number,
) => {
    for (let dropped = 0; dropped < count; dropped += 1) {
        const ends: string[] = []
        for (const key of path) {
            if (kept.has(key)) {
                continue
            }

            let routeNeighbors = 0
            for (const neighbor of neighborsOf(positionOf(key))) {
                if (path.has(keyOf(neighbor))) {
                    routeNeighbors += 1
                }
            }
            if (routeNeighbors <= 1) {
                ends.push(key)
            }
        }

        if (ends.length === 0) {
            return
        }

        path.delete(ends[Math.floor(random() * ends.length)])
    }
}

// Spends the budget on stat value, connected to the start: the greedy fill,
// then tries that drop part of the best route and grow it again a little
// differently, until `limit` ends the search. Kept nodes (start, targets)
// stay in.
export const searchStatFill = async ({
    layout,
    startKey,
    kept,
    route,
    budget,
    weights,
    limit,
    random = Math.random,
    onProgress,
    onBest,
}: {
    layout: BoardLayout
    startKey: string
    kept: ReadonlySet<string>
    // Connected, holds every kept node.
    route: ReadonlySet<string>
    budget: number
    weights: ReadonlyMap<string, number>
    limit: SearchLimit
    random?: () => number
    onProgress: (progress: PlannerProgress) => void
    onBest: (best: StatFillRoute) => void
}): Promise<StatFillRoute> => {
    const startedAt = performance.now()
    const maxMs = Math.max(0, limit.maxMs)
    const stallMs = limit.stallMs ?? Number.POSITIVE_INFINITY

    const grow = (path: Set<string>, noise?: () => number) => {
        return growByStatValue({
            layout: layout,
            route: path,
            cost: routeCost(layout, path, startKey),
            budget: budget,
            weights: weights,
            noise: noise,
        }).path
    }

    let best = grow(new Set(route))
    let bestValue = routeValue(layout, weights, best)
    let bestCost = routeCost(layout, best, startKey)

    const isBetter = (path: Set<string>) => {
        const cost = routeCost(layout, path, startKey)
        if (cost > budget) {
            return false
        }

        const value = routeValue(layout, weights, path)
        return value > bestValue || (value === bestValue && cost < bestCost)
    }

    const keep = (path: Set<string>) => {
        best = path
        bestValue = routeValue(layout, weights, path)
        bestCost = routeCost(layout, path, startKey)
    }

    onBest({ path: new Set(best), cost: bestCost })

    let attempts = 1
    let lastImprovedAt = 0
    let lastProgressAt = 0
    let lastYieldAt = performance.now()

    const worthKeys = [...weights.keys()].filter((key) => {
        return (weights.get(key) ?? 0) > 0
    })

    while (!limit.shouldStop?.()) {
        const elapsedMs = performance.now() - startedAt
        if (elapsedMs >= maxMs || elapsedMs - lastImprovedAt >= stallMs) {
            break
        }

        // Every node worth anything is in: nothing left to find.
        if (worthKeys.every((key) => best.has(key))) {
            break
        }

        const path = new Set(best)
        dropEnds(path, kept, 1 + Math.floor(random() * MAX_DROPPED), random)
        const amount = random() * MAX_NOISE * 2
        const noisy = grow(path, () => {
            return 1 + (random() - 0.5) * amount
        })
        const polished = new Set(noisy)
        dropEnds(
            polished,
            kept,
            1 + Math.floor(random() * MAX_POLISH_DROPPED),
            random,
        )
        attempts += 1

        let improved = false
        for (const tried of [noisy, grow(polished)]) {
            if (isBetter(tried)) {
                keep(tried)
                improved = true
            }
        }

        if (improved) {
            lastImprovedAt = performance.now() - startedAt
            onBest({ path: new Set(best), cost: bestCost })
        }

        if (performance.now() - lastYieldAt >= YIELD_EVERY_MS) {
            lastYieldAt = performance.now()
            await new Promise<void>((resolve) => setTimeout(resolve, 0))
        }

        const now = performance.now() - startedAt
        if (now - lastProgressAt >= PROGRESS_EVERY_MS) {
            onProgress({
                attempts: attempts,
                elapsedMs: now,
                idleMs: now - lastImprovedAt,
            })
            lastProgressAt = now
        }
    }

    const elapsedMs = performance.now() - startedAt
    onProgress({
        attempts: attempts,
        elapsedMs: elapsedMs,
        idleMs: elapsedMs - lastImprovedAt,
    })

    return { path: best, cost: bestCost }
}
