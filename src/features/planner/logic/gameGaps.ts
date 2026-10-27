import type { BoardLayout } from "@planner/config/layouts"

// Where a node's in-game state differs from the plan.
export type GameGap = "missing" | "extra"

export type GameGaps = {
    // Planned but not acquired in game.
    missing: string[]
    // Acquired in game but not planned.
    extra: string[]
}

// Compares a board read from a game screenshot with the plan, in grid order.
// The start node is always acquired and never counts.
export const compareWithGame = (
    layout: BoardLayout,
    acquired: readonly string[],
    planned: ReadonlySet<string>,
): GameGaps => {
    const inGame = new Set(acquired)
    const gaps: GameGaps = { missing: [], extra: [] }

    for (let row = 0; row < layout.grid.length; row++) {
        for (let column = 0; column < layout.grid[row].length; column++) {
            const kind = layout.grid[row][column]
            const key = `${row},${column}`

            if (kind === "." || kind === "S") {
                continue
            }

            if (planned.has(key) && !inGame.has(key)) {
                gaps.missing.push(key)
            } else if (inGame.has(key) && !planned.has(key)) {
                gaps.extra.push(key)
            }
        }
    }

    return gaps
}

// Which gap, if any, each node has; for the board's markers.
export const gapsByCell = (gaps: GameGaps) => {
    const cells = new Map<string, GameGap>()

    for (const key of gaps.missing) {
        cells.set(key, "missing")
    }

    for (const key of gaps.extra) {
        cells.set(key, "extra")
    }

    return cells
}
