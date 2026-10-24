import { isNode, keyOf, type Position } from "@planner/config/boardConfig"
import type { BoardLayout } from "@planner/config/layouts"
import { BoardEdge } from "./BoardEdge"

type BoardEdgeLine = {
    from: Position
    to: Position
    horizontal: boolean
}

// Right and down neighbours only, so each edge is listed once.
const getBoardEdges = (layout: BoardLayout) => {
    const edges: BoardEdgeLine[] = []

    for (let row = 0; row < layout.grid.length; row++) {
        for (let column = 0; column < layout.grid[row].length; column++) {
            const from = { row: row, column: column }

            if (!isNode(layout, from)) {
                continue
            }

            const neighbors = [
                { to: { row: row, column: column + 1 }, horizontal: true },
                { to: { row: row + 1, column: column }, horizontal: false },
            ]

            for (const neighbor of neighbors) {
                if (isNode(layout, neighbor.to)) {
                    edges.push({
                        from: from,
                        to: neighbor.to,
                        horizontal: neighbor.horizontal,
                    })
                }
            }
        }
    }

    return edges
}

type BoardEdgesProps = {
    layout: BoardLayout
    connectedCells: Set<string>
}

export const BoardEdges = ({ layout, connectedCells }: BoardEdgesProps) => {
    const isConnected = (edge: BoardEdgeLine) => {
        return (
            connectedCells.has(keyOf(edge.from)) &&
            connectedCells.has(keyOf(edge.to))
        )
    }

    const edges = getBoardEdges(layout)

    return edges.map((edge) => (
        <BoardEdge
            key={`${keyOf(edge.from)}-${keyOf(edge.to)}`}
            column={edge.from.column}
            horizontal={edge.horizontal}
            isActive={isConnected(edge)}
            row={edge.from.row}
        />
    ))
}
