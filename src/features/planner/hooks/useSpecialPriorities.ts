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
    readSpecialSkips,
    writeSpecialPriorities,
    writeSpecialSkips,
    type SpecialNodeCount,
    type SpecialPriorities,
    type SpecialSkips,
} from "@planner/storage/specialPriorities"

const readPriorities = (
    classId: string,
): {
    priorities: SpecialPriorities
    skips: SpecialSkips
    error: string | null
} => {
    try {
        return {
            priorities: readSpecialPriorities(classId),
            skips: readSpecialSkips(classId),
            error: null,
        }
    } catch (error) {
        return {
            priorities: DEFAULT_SPECIAL_PRIORITIES,
            skips: {},
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
    const [skips, setSkips] = useState(initial.skips)
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
                setSkips(next.skips)
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

    const updateSkip = (bonus: SpecialBonusType, skipped: boolean) => {
        const nextSkips: Partial<Record<SpecialBonusType, true>> = {
            ...skips,
        }
        if (skipped) {
            nextSkips[bonus] = true
        } else {
            delete nextSkips[bonus]
        }

        const writeError = writeSpecialSkips(classId, nextSkips)
        if (writeError) {
            setError(writeError)
            return
        }

        setSkips(nextSkips)
        setError(null)
    }

    return {
        priorities: priorities,
        skips: skips,
        counts: nodeCounts.counts,
        error: error ?? nodeCounts.error,
        updatePriority: updatePriority,
        updateSkip: updateSkip,
    }
}
