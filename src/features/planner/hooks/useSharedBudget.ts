import { useEffect, useState } from "react"
import type { LayoutType } from "@planner/config/layouts"
import {
    readRouteCostOfOtherBoards,
    readSharedTotalPoints,
    subscribeToBoardStorage,
    writeSharedTotalPoints,
} from "@planner/storage/boardStorage"

type SharedBudget = {
    totalPoints: number
    usedByOtherBoards: number
    // What this board's route may spend: the shared total minus the other
    // boards' current routes.
    availablePoints: number
}

const readBudget = (classId: string, layout: LayoutType): SharedBudget => {
    const totalPoints = readSharedTotalPoints(classId)
    const usedByOtherBoards = readRouteCostOfOtherBoards(classId, layout)
    return {
        totalPoints: totalPoints,
        usedByOtherBoards: usedByOtherBoards,
        availablePoints: Math.max(0, totalPoints - usedByOtherBoards),
    }
}

// One point budget shared by every board and by the All boards tab.
export const useSharedBudget = (classId: string, layout: LayoutType) => {
    const [budget, setBudget] = useState(() => readBudget(classId, layout))

    useEffect(
        () =>
            subscribeToBoardStorage(() =>
                setBudget(readBudget(classId, layout)),
            ),
        [classId, layout],
    )

    const setTotalPoints = (totalPoints: number) => {
        const error = writeSharedTotalPoints(classId, totalPoints)
        setBudget(readBudget(classId, layout))
        return error
    }

    return { ...budget, setTotalPoints: setTotalPoints }
}
