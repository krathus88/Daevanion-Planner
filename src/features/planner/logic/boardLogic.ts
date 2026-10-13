import { isNode, keyOf, type Position } from "@planner/config/boardConfig"
import { POINTS_PER_NODE_TYPE, type BoardLayout } from "@planner/config/layouts"

export const positionOf = (key: string): Position => {
    const [row, column] = key.split(",").map(Number)

    return { row: row, column: column }
}

export const neighborsOf = ({ row, column }: Position): Position[] => {
    return [
        { row: row - 1, column: column },
        { row: row + 1, column: column },
        { row: row, column: column - 1 },
        { row: row, column: column + 1 },
    ]
}

export const nodeCost = (layout: BoardLayout, position: Position) => {
    const kind = layout.grid[position.row][position.column]
    if (kind === "S") {
        return 0
    }

    return POINTS_PER_NODE_TYPE[
        (layout.specialNodes[kind] ?? layout.mainNode).type
    ]
}

const getPathCost = (layout: BoardLayout, path: Position[]) => {
    return path.reduce(
        (total, position) => total + nodeCost(layout, position),
        0,
    )
}

export const getConnectionCosts = (
    layout: BoardLayout,
    start: Position,
    selectedCells: Set<string>,
) => {
    const distances = new Map<string, number>()
    const unsettled = new Set<string>()
    const sources = [start, ...[...selectedCells].map(positionOf)]

    for (const source of sources) {
        const key = keyOf(source)
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
        const current = positionOf(currentKey)
        for (const neighbor of neighborsOf(current)) {
            if (!isNode(layout, neighbor)) {
                continue
            }

            const neighborKey = keyOf(neighbor)
            const nextDistance =
                currentDistance +
                (selectedCells.has(neighborKey)
                    ? 0
                    : nodeCost(layout, neighbor))
            if (
                nextDistance <
                (distances.get(neighborKey) ?? Number.POSITIVE_INFINITY)
            ) {
                distances.set(neighborKey, nextDistance)
                unsettled.add(neighborKey)
            }
        }
    }

    return distances
}

export const selectedNodeCost = (
    layout: BoardLayout,
    selectedCells: Set<string>,
) => {
    return [...selectedCells].reduce(
        (total, key) => total + nodeCost(layout, positionOf(key)),
        0,
    )
}

const nodesReachableFromStart = (
    layout: BoardLayout,
    start: Position,
    selected: Set<string>,
) => {
    const connected = new Set<string>()
    const queue = neighborsOf(start).filter(
        (position) => isNode(layout, position) && selected.has(keyOf(position)),
    )

    while (queue.length > 0) {
        const current = queue.shift()
        if (!current) {
            continue
        }

        const currentKey = keyOf(current)
        if (connected.has(currentKey)) {
            continue
        }

        connected.add(currentKey)
        for (const neighbor of neighborsOf(current)) {
            const neighborKey = keyOf(neighbor)
            if (
                isNode(layout, neighbor) &&
                selected.has(neighborKey) &&
                !connected.has(neighborKey)
            ) {
                queue.push(neighbor)
            }
        }
    }

    return connected
}

const findCheapestPath = (
    layout: BoardLayout,
    start: Position,
    selectedCells: Set<string>,
    target: Position,
): Position[] | null => {
    const targetKey = keyOf(target)
    const startKey = keyOf(start)
    if (!isNode(layout, target) || selectedCells.has(targetKey)) {
        return null
    }

    const starts = [start, ...[...selectedCells].map(positionOf)]
    const distances = new Map<string, number>()
    const previous = new Map<string, string | null>()
    const unsettled = new Set<string>()

    for (const source of starts) {
        const sourceKey = keyOf(source)
        distances.set(sourceKey, 0)
        previous.set(sourceKey, null)
        unsettled.add(sourceKey)
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
        if (currentKey === targetKey) {
            break
        }

        const current = positionOf(currentKey)
        for (const neighbor of neighborsOf(current)) {
            if (!isNode(layout, neighbor)) {
                continue
            }

            const neighborKey = keyOf(neighbor)
            if (selectedCells.has(neighborKey)) {
                if (!distances.has(neighborKey)) {
                    distances.set(neighborKey, 0)
                    previous.set(neighborKey, currentKey)
                    unsettled.add(neighborKey)
                }
                continue
            }

            const nextDistance = currentDistance + nodeCost(layout, neighbor)
            if (
                nextDistance <
                (distances.get(neighborKey) ?? Number.POSITIVE_INFINITY)
            ) {
                distances.set(neighborKey, nextDistance)
                previous.set(neighborKey, currentKey)
                unsettled.add(neighborKey)
            }
        }
    }

    if (!distances.has(targetKey)) {
        return null
    }

    const path: Position[] = []
    let currentKey: string | null | undefined = targetKey
    while (currentKey !== null && currentKey !== undefined) {
        if (!selectedCells.has(currentKey) && currentKey !== startKey) {
            path.push(positionOf(currentKey))
        }
        currentKey = previous.get(currentKey)
    }

    return path.reverse()
}

type SelectionChange = {
    selectedCells: Set<string>
    message: string
}

export const toggleNodeSelection = (
    layout: BoardLayout,
    start: Position,
    selectedCells: Set<string>,
    position: Position,
    availablePoints: number,
): SelectionChange => {
    const key = keyOf(position)
    const startKey = keyOf(start)

    if (key === startKey) {
        return {
            selectedCells: selectedCells,
            message:
                "The start node is the path origin and cannot be selected.",
        }
    }

    if (selectedCells.has(key)) {
        const nextSelected = new Set(selectedCells)
        nextSelected.delete(key)

        return {
            selectedCells: nodesReachableFromStart(layout, start, nextSelected),
            message: "",
        }
    }

    const path = findCheapestPath(layout, start, selectedCells, position)
    if (!path) {
        return {
            selectedCells: selectedCells,
            message: "There is no connected path to that node.",
        }
    }

    const pathCost = getPathCost(layout, path)
    if (pathCost > availablePoints) {
        return {
            selectedCells: selectedCells,
            message: `That path costs ${pathCost} points, but only ${availablePoints} remain.`,
        }
    }

    return {
        selectedCells: new Set([...selectedCells, ...path.map(keyOf)]),
        message: "",
    }
}

export const createInitialSelection = () => {
    return new Set<string>()
}
