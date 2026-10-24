import { useEffect, useState } from "react"
import type { ArielStatType } from "@config/stats/stats"
import { errorMessage } from "@planner/logic/errorMessage"
import { readArielStatNodeCounts } from "@planner/storage/arielSettings"
import { subscribeToBoardStorage } from "@planner/storage/boardStorage"
import type { StatNodeCount } from "@planner/storage/statPriorities"

const readCounts = (classId: string) => {
    try {
        return { counts: readArielStatNodeCounts(classId), error: null }
    } catch (error) {
        return {
            counts: null,
            error: errorMessage(error, "Could not read Ariel stat counts."),
        }
    }
}

export const useArielStatNodeCounts = (classId: string) => {
    const [state, setState] = useState<{
        counts: Record<ArielStatType, StatNodeCount> | null
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
