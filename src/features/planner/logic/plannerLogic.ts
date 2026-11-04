import { isNode, keyOf, type Position } from "@planner/config/boardConfig"
import { appearanceCost, type BoardLayout } from "@planner/config/layouts"
import { formatSearchTime } from "@planner/config/searchTime"

const positionOf = (index: number, width: number): Position => {
    return {
        row: Math.floor(index / width),
        column: index % width,
    }
}

const nodeCost = (layout: BoardLayout, index: number, width: number) => {
    const { row, column } = positionOf(index, width)
    const kind = layout.grid[row][column]
    if (kind === "S") {
        return 0
    }

    return appearanceCost(layout.specialNodes[kind] ?? layout.mainNode)
}

export type PlannerResult =
    | { ok: true; path: Set<string>; cost: number; statScore: number }
    | { ok: false; reason: string }

export type PlannerProgress = {
    attempts: number
    elapsedMs: number
    // Time since the last better route, or since the start.
    idleMs: number
}

export type SearchLimit = {
    // The longest the search may run.
    maxMs: number
    // Ends the search once this long passes without a better route.
    stallMs?: number
    // Checked between attempts: true ends the search with what it has.
    shouldStop?: () => boolean
}

export type PlannerSearchCallbacks = {
    onProgress: (progress: PlannerProgress) => void
    onBest: (result: Extract<PlannerResult, { ok: true }>) => void
}

const buildNeighbors = (layout: BoardLayout, width: number, height: number) => {
    const gridIndices: number[] = []
    const nodeIndexByGrid = new Int32Array(width * height).fill(-1)

    for (let gridIndex = 0; gridIndex < width * height; gridIndex += 1) {
        if (isNode(layout, positionOf(gridIndex, width))) {
            nodeIndexByGrid[gridIndex] = gridIndices.length
            gridIndices.push(gridIndex)
        }
    }

    const neighbors: number[][] = Array.from(
        { length: gridIndices.length },
        () => [],
    )
    for (let index = 0; index < gridIndices.length; index += 1) {
        const { row, column } = positionOf(gridIndices[index], width)
        const adjacentGridIndices = [
            row > 0 ? gridIndices[index] - width : -1,
            row + 1 < height ? gridIndices[index] + width : -1,
            column > 0 ? gridIndices[index] - 1 : -1,
            column + 1 < width ? gridIndices[index] + 1 : -1,
        ]

        for (const adjacentGridIndex of adjacentGridIndices) {
            if (adjacentGridIndex < 0) {
                continue
            }

            const adjacentIndex = nodeIndexByGrid[adjacentGridIndex]
            if (adjacentIndex >= 0) {
                neighbors[index].push(adjacentIndex)
            }
        }
    }

    return {
        gridIndices: gridIndices,
        nodeIndexByGrid: nodeIndexByGrid,
        neighbors: neighbors,
    }
}

const findTargetComponents = (
    startIndex: number,
    targets: Set<string>,
    width: number,
    nodeIndexByGrid: Int32Array,
    neighbors: number[][],
) => {
    const targetIndices = new Set<number>()
    for (const key of targets) {
        const [row, column] = key.split(",").map(Number)
        const index = nodeIndexByGrid[row * width + column]
        if (index >= 0 && index !== startIndex) {
            targetIndices.add(index)
        }
    }

    const components: number[][] = []
    while (targetIndices.size > 0) {
        const first = targetIndices.values().next().value as number
        targetIndices.delete(first)
        const component = [first]
        const queue = [first]

        for (let queueIndex = 0; queueIndex < queue.length; queueIndex += 1) {
            const current = queue[queueIndex]
            for (const neighbor of neighbors[current]) {
                if (targetIndices.delete(neighbor)) {
                    component.push(neighbor)
                    queue.push(neighbor)
                }
            }
        }

        components.push(component)
    }

    return components
}

const findConnection = (
    tree: Set<number>,
    component: number[],
    neighbors: number[][],
    costs: Float64Array,
) => {
    const distances = new Float64Array(neighbors.length).fill(
        Number.POSITIVE_INFINITY,
    )
    const parents = new Int32Array(neighbors.length).fill(-1)
    const settled = new Uint8Array(neighbors.length)

    for (const node of tree) {
        distances[node] = 0
        parents[node] = -2
    }

    let destination = -1
    for (let step = 0; step < neighbors.length; step += 1) {
        let current = -1
        let bestDistance = Number.POSITIVE_INFINITY
        for (let node = 0; node < neighbors.length; node += 1) {
            if (
                !settled[node] &&
                (distances[node] < bestDistance ||
                    (distances[node] === bestDistance &&
                        Number.isFinite(bestDistance) &&
                        Math.random() < 0.5))
            ) {
                current = node
                bestDistance = distances[node]
            }
        }

        if (current < 0) {
            break
        }
        if (component.includes(current)) {
            destination = current
            break
        }

        settled[current] = 1
        for (const neighbor of neighbors[current]) {
            const candidate = bestDistance + costs[neighbor]
            if (
                candidate < distances[neighbor] ||
                (candidate === distances[neighbor] &&
                    !settled[neighbor] &&
                    parents[neighbor] >= 0 &&
                    Math.random() < 0.5)
            ) {
                distances[neighbor] = candidate
                parents[neighbor] = current
            }
        }
    }

    if (destination < 0) {
        return null
    }

    const route: number[] = []
    let current = destination
    while (current >= 0 && parents[current] !== -2) {
        route.push(current)
        current = parents[current]
    }

    if (current < 0) {
        return null
    }

    return route
}

const shuffled = (values: number[][]) => {
    const result = [...values]
    for (let index = result.length - 1; index > 0; index -= 1) {
        const swapIndex = Math.floor(Math.random() * (index + 1))
        ;[result[index], result[swapIndex]] = [result[swapIndex], result[index]]
    }
    return result
}

const createRoute = (
    componentOrder: number[][],
    startIndex: number,
    neighbors: number[][],
    costs: Float64Array,
) => {
    const tree = new Set<number>([startIndex])
    for (const component of componentOrder) {
        if (component.some((node) => tree.has(node))) {
            for (const node of component) {
                tree.add(node)
            }
            continue
        }

        const connection = findConnection(tree, component, neighbors, costs)
        if (!connection) {
            return null
        }

        for (const node of connection) {
            tree.add(node)
        }
        for (const node of component) {
            tree.add(node)
        }
    }

    return tree
}

// Shared by every search, so a run of short searches still lets the worker
// read a stop message.
const YIELD_EVERY_MS = 25
let lastYieldAt = Number.NEGATIVE_INFINITY

export const findPlannerPath = async (
    layout: BoardLayout,
    start: Position,
    targets: Set<string>,
    limit: SearchLimit,
    callbacks: PlannerSearchCallbacks,
    statWeights: ReadonlyMap<string, number> = new Map(),
): Promise<PlannerResult> => {
    if (targets.size === 0) {
        return {
            ok: false,
            reason: "Select at least one node to plan a route.",
        }
    }

    const width = layout.grid[0].length
    const height = layout.grid.length
    const { gridIndices, nodeIndexByGrid, neighbors } = buildNeighbors(
        layout,
        width,
        height,
    )
    const startIndex = nodeIndexByGrid[start.row * width + start.column]
    const components = findTargetComponents(
        startIndex,
        targets,
        width,
        nodeIndexByGrid,
        neighbors,
    )

    if (components.length === 0) {
        return {
            ok: false,
            reason: "Select at least one node other than the start.",
        }
    }

    const keyAt = (node: number) => {
        return keyOf(positionOf(gridIndices[node], width))
    }
    // Discounts total under half a point, so they only break cost ties.
    let totalWeight = 0
    for (const weight of statWeights.values()) {
        totalWeight += weight
    }
    const costs = new Float64Array(gridIndices.length)
    for (let index = 0; index < gridIndices.length; index += 1) {
        costs[index] = nodeCost(layout, gridIndices[index], width)
        const weight = statWeights.get(keyAt(index)) ?? 0
        if (weight > 0 && costs[index] > 0) {
            costs[index] -= weight / (totalWeight * 2)
        }
    }
    for (
        let componentIndex = 0;
        componentIndex < components.length;
        componentIndex += 1
    ) {
        for (const node of components[componentIndex]) {
            costs[node] = 0
        }
    }

    let bestRoute: Set<number> | null = null
    let bestCost = Number.POSITIVE_INFINITY
    let bestScore = Number.NEGATIVE_INFINITY
    let attempts = 0
    const startedAt = performance.now()
    const maxMs = Math.max(0, limit.maxMs)
    const stallMs = limit.stallMs ?? Number.POSITIVE_INFINITY
    // Both are ms since the start.
    let lastProgressAt = 0
    let lastImprovedAt = 0

    do {
        const order = attempts === 0 ? components : shuffled(components)
        const route = createRoute(order, startIndex, neighbors, costs)
        attempts += 1

        if (route) {
            let cost = 0
            let score = 0
            for (const node of route) {
                cost += nodeCost(layout, gridIndices[node], width)
                score += statWeights.get(keyAt(node)) ?? 0
            }
            if (cost < bestCost || (cost === bestCost && score > bestScore)) {
                bestRoute = route
                bestCost = cost
                bestScore = score
                lastImprovedAt = performance.now() - startedAt
                callbacks.onBest({
                    ok: true,
                    path: new Set(
                        [...route]
                            .filter((node) => node !== startIndex)
                            .map(keyAt),
                    ),
                    cost: cost,
                    statScore: score,
                })
            }
        }

        // Before the checks, so a search that ends after one attempt still
        // gives a stop message its turn.
        if (performance.now() - lastYieldAt >= YIELD_EVERY_MS) {
            lastYieldAt = performance.now()
            await new Promise<void>((resolve) => setTimeout(resolve, 0))
        }

        const elapsedMs = performance.now() - startedAt
        if (elapsedMs >= maxMs || elapsedMs - lastImprovedAt >= stallMs) {
            break
        }
        if (elapsedMs - lastProgressAt >= 500) {
            callbacks.onProgress({
                attempts: attempts,
                elapsedMs: elapsedMs,
                idleMs: elapsedMs - lastImprovedAt,
            })
            lastProgressAt = elapsedMs
        }
    } while (!limit.shouldStop?.())

    const elapsedMs = performance.now() - startedAt
    callbacks.onProgress({
        attempts: attempts,
        elapsedMs: elapsedMs,
        idleMs: elapsedMs - lastImprovedAt,
    })
    if (!bestRoute) {
        return {
            ok: false,
            reason: "The planner could not connect all of the required nodes.",
        }
    }

    const path = new Set(
        [...bestRoute].filter((node) => node !== startIndex).map(keyAt),
    )
    return { ok: true, path: path, cost: bestCost, statScore: bestScore }
}

export const formatPlannerDuration = (milliseconds: number) => {
    if (milliseconds < 1000) {
        return `${Math.max(1, Math.ceil(milliseconds))} ms`
    }
    if (milliseconds < 60_000) {
        return `${(milliseconds / 1000).toFixed(1)} sec`
    }
    return formatSearchTime(milliseconds / 1000)
}
