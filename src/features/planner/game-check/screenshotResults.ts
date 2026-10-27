import type { BoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import type { BoardState } from "@planner/hooks/useBoardState"
import type { ScreenshotResult } from "@planner/hooks/useGameScreenshots"
import { compareWithGame } from "@planner/logic/gameGaps"
import { readPlannedCells } from "@planner/storage/boardStorage"

// Boards read, once each in reading order, and the files with no board.
export const groupResults = (results: ScreenshotResult[]) => {
    const boardIds = new Set<BoardId>()
    const skippedFiles: string[] = []

    for (const result of results) {
        if (result.boardId) {
            boardIds.add(result.boardId)
        } else {
            skippedFiles.push(result.fileName)
        }
    }

    return { boardIds: [...boardIds], skippedFiles: skippedFiles }
}

// A board's gaps against what it shows in the current view; the open board
// uses its live state, others what was last saved.
export const getBoardGaps = (board: BoardState, boardId: BoardId) => {
    const acquired = board.gameCheck.readings[boardId]

    if (!acquired) {
        return null
    }

    const planned =
        boardId === board.layoutName
            ? board.selectedForView
            : readPlannedCells(board.classPreset.id, boardId, board.view)

    return compareWithGame(layouts[boardId], acquired, planned)
}
