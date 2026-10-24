import { useEffect, useState } from "react"
import { MAIN_BOARD_IDS, type MainBoardId } from "@config/boards"
import type { SpecialBonusType } from "@planner/config/specialNodes"
import { errorMessage } from "@planner/logic/errorMessage"
import { subscribeToBoardStorage } from "@planner/storage/boardStorage"
import { subscribeToClassSettings } from "@planner/storage/classSettings"
import {
    DEFAULT_SPECIAL_PRIORITIES,
    readSharedSpecialNodeCounts,
    readSpecialPriorities,
    writeSpecialPriorities,
    type SpecialNodeCount,
} from "@planner/storage/specialPriorities"

const readPriorities = (classId: string) => {
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

const readCounts = (classId: string, layout?: MainBoardId) => {
    try {
        return {
            counts: readSharedSpecialNodeCounts(
                classId,
                layout ? [layout] : MAIN_BOARD_IDS,
            ),
            error: null,
        }
    } catch (error) {
        return {
            counts: null,
            error: errorMessage(error, "Could not read special node counts."),
        }
    }
}

export const useSpecialPriorities = (classId: string, layout?: MainBoardId) => {
    const [initial] = useState(() => readPriorities(classId))
    const [priorities, setPriorities] = useState(initial.priorities)
    const [error, setError] = useState<string | null>(initial.error)
    const [nodeCounts, setNodeCounts] = useState<{
        counts: Record<SpecialBonusType, SpecialNodeCount> | null
        error: string | null
    }>(() => readCounts(classId, layout))

    useEffect(
        () =>
            subscribeToBoardStorage(() => {
                setNodeCounts(readCounts(classId, layout))
            }),
        [classId, layout],
    )

    useEffect(
        () =>
            subscribeToClassSettings(classId, () => {
                const next = readPriorities(classId)
                setPriorities(next.priorities)
                setError(next.error)
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
