import { useEffect, useState } from "react"
import { MAIN_BOARD_IDS, type MainBoardId } from "@config/boards"
import { errorMessage } from "@planner/logic/errorMessage"
import { subscribeToBoardStorage } from "@planner/storage/boardStorage"
import {
    readSharedStatNodeCounts,
    type StatNodeCount,
} from "@planner/storage/statPriorities"
import type { StatType } from "@config/stats/stats"

const readCounts = (classId: string, layout?: MainBoardId) => {
    try {
        return {
            counts: readSharedStatNodeCounts(
                classId,
                layout ? [layout] : MAIN_BOARD_IDS,
            ),
            error: null,
        }
    } catch (error) {
        return {
            counts: null,
            error: errorMessage(error, "Could not read stat node counts."),
        }
    }
}

export const useStatNodeCounts = (classId: string, layout?: MainBoardId) => {
    const [state, setState] = useState<{
        counts: Record<StatType, StatNodeCount> | null
        error: string | null
    }>(() => readCounts(classId, layout))

    useEffect(
        () =>
            subscribeToBoardStorage(() => {
                setState(readCounts(classId, layout))
            }),
        [classId, layout],
    )

    return state
}
