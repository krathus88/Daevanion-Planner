import { isNode, keyOf } from "@planner/config/boardConfig"
import type { BoardLayout } from "@planner/config/layouts"
import { neighborsOf, nodeCost, positionOf } from "./boardLogic"

// Weight counts once per point a node costs, so a tier is worth the same
// per point on every node. `noise` (around 1) scales each option's value, so
// a search can try other picks than the best one.
export const growByStatValue = ({
    layout,
    route,
    cost,
    budget,
    weights,
    noise,
}: {
    layout: BoardLayout
    route: ReadonlySet<string>
    cost: number
    budget: number
    weights: ReadonlyMap<string, number>
    noise?: () => number
}) => {
    const path = new Set(route)
    let total = cost

    while (total < budget) {
        const { distances, parents } = connectionCosts(layout, path)
        let best: { connector: string[]; cost: number; value: number } | null =
            null

        for (const [key, distance] of distances) {
            if (
                path.has(key) ||
                (weights.get(key) ?? 0) <= 0 ||
                total + distance > budget
            ) {
                continue
            }

            const connector: string[] = []
            let gained = 0
            let current: string | undefined = key
            while (current !== undefined && !path.has(current)) {
                connector.push(current)
                gained +=
                    (weights.get(current) ?? 0) *
                    nodeCost(layout, positionOf(current))
                current = parents.get(current)
            }

            const value = (gained / distance) * (noise?.() ?? 1)
            if (
                !best ||
                value > best.value ||
                (value === best.value && distance < best.cost)
            ) {
                best = { connector: connector, cost: distance, value: value }
            }
        }

        if (!best) {
            break
        }

        for (const key of best.connector) {
            path.add(key)
        }
        total += best.cost
    }

    return { path: path, cost: total }
}

const connectionCosts = (layout: BoardLayout, route: ReadonlySet<string>) => {
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
            const nextDistance = currentDistance + nodeCost(layout, neighbor)
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

    return { distances: distances, parents: parents }
}
