import type { BoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import type { BoardState } from "@planner/hooks/useBoardState"
import type { GameReadings } from "@planner/hooks/useGameCheck"
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
// uses its live state, others what was last saved. Readings just added aren't
// in board.gameCheck until the next render: pass them in.
export const getBoardGaps = (
    board: BoardState,
    boardId: BoardId,
    readings: GameReadings = board.gameCheck.readings,
) => {
    const acquired = readings[boardId]

    if (!acquired) {
        return null
    }

    const planned =
        boardId === board.layoutName
            ? board.selectedForView
            : readPlannedCells(board.classPreset.id, boardId, board.view)

    return compareWithGame(layouts[boardId], acquired, planned)
}

// Whether a board read differs from what it shows in the current view.
export const differsFromGame = (
    board: BoardState,
    boardId: BoardId,
    readings?: GameReadings,
) => {
    const gaps = getBoardGaps(board, boardId, readings)

    return gaps !== null && (gaps.missing.length > 0 || gaps.extra.length > 0)
}

// The board to open after a check: none while the open board differs from the
// game, else the first board read (in screenshot order) that does.
export const pickBoardToShow = (
    openBoardId: BoardId,
    boardIds: BoardId[],
    differs: (boardId: BoardId) => boolean,
) => {
    if (differs(openBoardId)) {
        return null
    }

    return boardIds.find(differs) ?? null
}
