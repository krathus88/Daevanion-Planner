import { useEffect, useState } from "react"
import { errorMessage } from "@planner/logic/errorMessage"
import { subscribeToBoardStorage } from "@planner/storage/boardStorage"
import {
    readSharedStatNodeCounts,
    type StatNodeCount,
} from "@planner/storage/statPriorities"
import type { StatType } from "@planner/config/stats"

const readCounts = (classId: string) => {
    try {
        return { counts: readSharedStatNodeCounts(classId), error: null }
    } catch (error) {
        return {
            counts: null,
            error: errorMessage(error, "Could not read stat node counts."),
        }
    }
}

// How many stat nodes of each stat the boards' current routes take, out of
// how many exist across all boards. Updates when any board changes.
export const useStatNodeCounts = (classId: string) => {
    const [state, setState] = useState<{
        counts: Record<StatType, StatNodeCount> | null
        error: string | null
    }>(() => readCounts(classId))

    useEffect(
        () =>
            subscribeToBoardStorage(() => {
                setState(readCounts(classId))
            }),
        [classId],
    )

    return state
}
