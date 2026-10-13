import { useEffect, useState } from "react"
import type { BoardLayoutName } from "../config/layouts"
import {
    readRouteCostOfOtherBoards,
    readSharedTotalPoints,
    subscribeToBoardStorage,
    writeSharedTotalPoints,
} from "../storage/boardStorage"

type SharedBudget = {
    totalPoints: number
    usedByOtherBoards: number
    // What this board's route may spend: the shared total minus the other
    // boards' current routes.
    availablePoints: number
}

const readBudget = (classId: string, layout: BoardLayoutName): SharedBudget => {
    const totalPoints = readSharedTotalPoints(classId)
    const usedByOtherBoards = readRouteCostOfOtherBoards(classId, layout)
    return {
        totalPoints,
        usedByOtherBoards,
        availablePoints: Math.max(0, totalPoints - usedByOtherBoards),
    }
}

// One point budget shared by every board and by the All boards tab.
export const useSharedBudget = (classId: string, layout: BoardLayoutName) => {
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

    return { ...budget, setTotalPoints }
}
