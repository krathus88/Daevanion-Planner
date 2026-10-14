import { useEffect, useState } from "react"
import type { SpecialBonusType } from "@planner/config/specialNodes"
import { errorMessage } from "@planner/logic/errorMessage"
import { subscribeToBoardStorage } from "@planner/storage/boardStorage"
import {
    DEFAULT_SPECIAL_PRIORITIES,
    readSharedSpecialNodeCounts,
    readSpecialPriorities,
    writeSpecialPriorities,
    type SpecialNodeCount,
} from "@planner/storage/specialPriorities"

const readInitialPriorities = (classId: string) => {
    try {
        return { priorities: readSpecialPriorities(classId), error: null }
    } catch (error) {
        return {
            priorities: DEFAULT_SPECIAL_PRIORITIES,
            error: errorMessage(
                error,
                "Could not read special node priorities.",
            ),
        }
    }
}

const readCounts = (classId: string) => {
    try {
        return { counts: readSharedSpecialNodeCounts(classId), error: null }
    } catch (error) {
        return {
            counts: null,
            error: errorMessage(error, "Could not read special node counts."),
        }
    }
}

// Each special node bonus's rank, plus how many of its nodes the boards'
// current routes take. Counts update when any board changes.
export const useSpecialPriorities = (classId: string) => {
    const [initial] = useState(() => readInitialPriorities(classId))
    const [priorities, setPriorities] = useState(initial.priorities)
    const [error, setError] = useState<string | null>(initial.error)
    const [nodeCounts, setNodeCounts] = useState<{
        counts: Record<SpecialBonusType, SpecialNodeCount> | null
        error: string | null
    }>(() => readCounts(classId))

    useEffect(
        () =>
            subscribeToBoardStorage(() => {
                setNodeCounts(readCounts(classId))
            }),
        [classId],
    )

    const updatePriority = (bonus: SpecialBonusType, priority: number) => {
        const nextPriorities = { ...priorities, [bonus]: priority }
        const writeError = writeSpecialPriorities(classId, nextPriorities)
        if (writeError) {
            setError(writeError)
            return
        }

        setPriorities(nextPriorities)
        setError(null)
    }

    return {
        priorities: priorities,
        counts: nodeCounts.counts,
        error: error ?? nodeCounts.error,
        updatePriority: updatePriority,
    }
}
