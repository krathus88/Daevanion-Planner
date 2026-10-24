import { isNode, keyOf } from "@planner/config/boardConfig"
import type { BoardLayout } from "@planner/config/layouts"
import { neighborsOf, nodeCost, positionOf } from "./boardLogic"
import type { PathFocusGroup } from "./pathPriorities"

export type StatStep = {
    key: string
    connector: string[]
    cost: number
    detour: number
    // Infinity when no ability is left waiting.
    toWaiting: number
}

// Far apart so any detour point outweighs any number of wanted stat points.
const DETOUR_WEIGHT = 10_000

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

export const growWithFocus = ({
    layout,
    route,
    cost,
    budget,
    groups,
}: {
    layout: BoardLayout
    route: ReadonlySet<string>
    cost: number
    budget: number
    groups: readonly PathFocusGroup[]
}) => {
    const path = new Set(route)
    let total = cost

    for (const group of groups) {
        const wanted = new Set(group.wanted)
        const free = new Set(group.free)

        while (total < budget) {
            const steps = findStatSteps({
                layout: layout,
                route: path,
                wanted: wanted,
                waiting: group.waiting.filter((key) => !path.has(key)),
                maxDetour: group.detour,
                isFree: (key) => free.has(key),
            })
            const step = steps.find(
                (candidate) => total + candidate.cost <= budget,
            )
            if (!step) {
                break
            }

            for (const key of step.connector) {
                path.add(key)
            }
            total += step.cost
        }
    }

    return { path: path, cost: total }
}
