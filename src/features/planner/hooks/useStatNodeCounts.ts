import { useEffect, useState } from "react"
import { BOARD_IDS, type BoardId } from "@config/boards"
import { errorMessage } from "@planner/logic/errorMessage"
import { subscribeToBoardStorage } from "@planner/storage/boardStorage"
import {
    readSharedStatNodeCounts,
    type StatNodeCount,
} from "@planner/storage/statPriorities"
import type { StatType } from "@config/stats/stats"

const readCounts = (classId: string, layout?: BoardId) => {
    try {
        return {
            counts: readSharedStatNodeCounts(
                classId,
                layout ? [layout] : BOARD_IDS,
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

// How many stat nodes of each stat the boards' current routes take, out of
// how many exist across all boards, or on `layout` only. Updates when any
// board changes.
export const useStatNodeCounts = (classId: string, layout?: BoardId) => {
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
