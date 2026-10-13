import { isNode, keyOf } from "@planner/config/boardConfig"
import type { BoardLayout } from "@planner/config/layouts"
import { neighborsOf, nodeCost, positionOf } from "./boardLogic"

// One way to add a wanted stat node to a board's route.
export type StatStep = {
    // The stat node the step reaches.
    key: string
    // Nodes added to the route, including `key`.
    connector: string[]
    // Points the step adds.
    cost: number
    // Points spent on nodes that aren't wanted stats.
    detour: number
    // Steps from `key` to the nearest ability still waiting for points;
    // Infinity when none is left on the board.
    toWaiting: number
}

// Far apart so any detour point outweighs any number of wanted stat points.
const DETOUR_WEIGHT = 10_000

// Steps from every node to the nearest of `sources`.
const stepsFrom = (layout: BoardLayout, sources: Iterable<string>) => {
    const distances = new Map<string, number>()
    const queue: string[] = []
    for (const key of sources) {
        distances.set(key, 0)
        queue.push(key)
    }

    for (let index = 0; index < queue.length; index += 1) {
        const key = queue[index]
        const distance = distances.get(key) ?? 0
        for (const neighbor of neighborsOf(positionOf(key))) {
            const neighborKey = keyOf(neighbor)
            if (isNode(layout, neighbor) && !distances.has(neighborKey)) {
                distances.set(neighborKey, distance + 1)
                queue.push(neighborKey)
            }
        }
    }

    return distances
}

// Every way to add one of `wanted` to a route that already holds `route`,
// within `maxDetour` points of other nodes. Each step takes the connection
// with the least detour, then the fewest points; `isFree` marks stat nodes
// that don't count as detour (the tier's own nodes and better ones).
// Sorted best first: least detour, then closest to a waiting ability, then
// cheapest.
export const findStatSteps = ({
    layout,
    route,
    wanted,
    waiting,
    maxDetour,
    isFree,
}: {
    layout: BoardLayout
    route: ReadonlySet<string>
    wanted: ReadonlySet<string>
    waiting: Iterable<string>
    maxDetour: number
    isFree: (key: string) => boolean
}) => {
    const distances = new Map<string, number>()
    const parents = new Map<string, string>()
    const unsettled = new Set<string>()
    for (const key of route) {
        distances.set(key, 0)
        unsettled.add(key)
    }

    while (unsettled.size > 0) {
        let currentKey: string | undefined
        let currentDistance = Number.POSITIVE_INFINITY
        for (const candidate of unsettled) {
            const distance =
                distances.get(candidate) ?? Number.POSITIVE_INFINITY
            if (distance < currentDistance) {
                currentKey = candidate
                currentDistance = distance
            }
        }

        if (currentKey === undefined) {
            break
        }

        unsettled.delete(currentKey)
        for (const neighbor of neighborsOf(positionOf(currentKey))) {
            if (!isNode(layout, neighbor)) {
                continue
            }

            const neighborKey = keyOf(neighbor)
            const points = nodeCost(layout, neighbor)
            const nextDistance =
                currentDistance +
                (isFree(neighborKey) ? points : points * (DETOUR_WEIGHT + 1))
            if (
                nextDistance <
                (distances.get(neighborKey) ?? Number.POSITIVE_INFINITY)
            ) {
                distances.set(neighborKey, nextDistance)
                parents.set(neighborKey, currentKey)
                unsettled.add(neighborKey)
            }
        }
    }

    const toWaiting = stepsFrom(layout, waiting)
    const steps: StatStep[] = []
    for (const key of wanted) {
        const distance = distances.get(key)
        if (distance === undefined || route.has(key)) {
            continue
        }

        const detour = Math.floor(distance / (DETOUR_WEIGHT + 1))
        if (detour > maxDetour) {
            continue
        }

        const connector: string[] = []
        let current: string | undefined = key
        while (current !== undefined && !route.has(current)) {
            connector.push(current)
            current = parents.get(current)
        }

        steps.push({
            key: key,
            connector: connector,
            cost: distance - detour * DETOUR_WEIGHT,
            detour: detour,
            toWaiting: toWaiting.get(key) ?? Number.POSITIVE_INFINITY,
        })
    }

    return steps.sort(
        (left, right) =>
            left.detour - right.detour ||
            left.toWaiting - right.toWaiting ||
            left.cost - right.cost,
    )
}
