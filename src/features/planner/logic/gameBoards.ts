import { GAME_BOARDS } from "@account/game/gameIds"
import { BOARD_IDS, type BoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import type { GameReadings } from "@planner/hooks/useGameCheck"

// The game numbers a board's cells 1-225, row by row, in a 15 x 15 grid with
// the board centered in it (Ariel fills it, the main boards sit 1-2 cells in).
const GAME_GRID = 15

// The companion's acquired cells as the planner's "row,col" keys, per board.
// Cells outside a board's grid or on a gap are left out.
export const toGameReadings = (boards: Record<string, number[]>) => {
    const readings: GameReadings = {}

    for (const [number, cells] of Object.entries(boards)) {
        const boardId = GAME_BOARDS[number]

        if (!boardId) {
            continue
        }

        const grid = layouts[boardId].grid
        const offset = (GAME_GRID - grid.length) / 2
        const acquired: string[] = []

        for (const cell of cells) {
            const row = Math.floor((cell - 1) / GAME_GRID) - offset
            const column = ((cell - 1) % GAME_GRID) - offset
            const symbol = grid[row]?.[column]

            if (symbol !== undefined && symbol !== ".") {
                acquired.push(`${row},${column}`)
            }
        }

        readings[boardId] = acquired
    }

    return readings
}

// The boards a check against the game reads: only the open one from This
// board, every board the game sent from All boards.
export const pickCheckedBoards = (
    readings: GameReadings,
    scope: "board" | "all",
    openBoardId: BoardId,
) => {
    return BOARD_IDS.filter((boardId) => {
        return (
            readings[boardId] !== undefined &&
            (scope === "all" || boardId === openBoardId)
        )
    })
}
