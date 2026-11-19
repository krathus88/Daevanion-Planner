import { useEffect, useState } from "react"
import { BOARD_NAMES, type StatBoardId } from "@config/boards"
import type { StatBoardStat } from "@config/stats/stats"
import { errorMessage } from "@planner/logic/errorMessage"
import { subscribeToBoardStorage } from "@planner/storage/boardStorage"
import { readStatBoardNodeCounts } from "@planner/storage/statBoardSettings"
import type { StatNodeCount } from "@planner/storage/statPriorities"

type NodeCounts = {
    key: string
    counts: Partial<Record<StatBoardStat, StatNodeCount>> | null
    error: string | null
}

const readCounts = (classId: string, board: StatBoardId): NodeCounts => {
    try {
        return {
            key: `${classId}:${board}`,
            counts: readStatBoardNodeCounts(classId, board),
            error: null,
        }
    } catch (error) {
        return {
            key: `${classId}:${board}`,
            counts: null,
            error: errorMessage(
                error,
                `Could not read ${BOARD_NAMES[board]} stat counts.`,
            ),
        }
    }
}

export const useStatBoardNodeCounts = (classId: string, board: StatBoardId) => {
    const [state, setState] = useState<NodeCounts>(() =>
        readCounts(classId, board),
    )

    // A board switch reads the other board's counts at once.
    const current =
        state.key === `${classId}:${board}` ? state : readCounts(classId, board)
    if (current !== state) {
        setState(current)
    }

    useEffect(
        () =>
            subscribeToBoardStorage(() => {
                setState(readCounts(classId, board))
            }),
        [classId, board],
    )

    return { counts: current.counts, error: current.error }
}
