import type { BoardLayout } from "./layouts"

export type Position = { row: number; column: number }

export const getStart = (layout: BoardLayout): Position => {
    const width = layout.grid[0]?.length ?? 0
    const startPositions: Position[] = []

    for (let row = 0; row < layout.grid.length; row += 1) {
        for (let column = 0; column < layout.grid[row].length; column += 1) {
            const kind = layout.grid[row][column]
            if (kind === "S") {
                startPositions.push({ row, column })
            }

            if (
                kind !== "." &&
                kind !== "#" &&
                kind !== "S" &&
                !Object.hasOwn(layout.specialNodes, kind)
            ) {
                throw new Error(`Invalid board cell marker: ${kind}`)
            }
        }
    }

    if (
        width === 0 ||
        layout.grid.some((row) => row.length !== width) ||
        startPositions.length !== 1
    ) {
        throw new Error(
            "A board layout must be rectangular and contain exactly one start node.",
        )
    }

    return startPositions[0]
}

export const isNode = (layout: BoardLayout, { row, column }: Position) =>
    layout.grid[row]?.[column] !== undefined && layout.grid[row][column] !== "."
