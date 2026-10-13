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

const readBudget = (layout: BoardLayoutName): SharedBudget => {
    const totalPoints = readSharedTotalPoints()
    const usedByOtherBoards = readRouteCostOfOtherBoards(layout)
    return {
        totalPoints,
        usedByOtherBoards,
        availablePoints: Math.max(0, totalPoints - usedByOtherBoards),
    }
}

// One point budget shared by every board and by the All boards tab.
export const useSharedBudget = (layout: BoardLayoutName) => {
    const [budget, setBudget] = useState(() => readBudget(layout))

    useEffect(
        () => subscribeToBoardStorage(() => setBudget(readBudget(layout))),
        [layout],
    )

    const setTotalPoints = (totalPoints: number) => {
        const error = writeSharedTotalPoints(totalPoints)
        setBudget(readBudget(layout))
        return error
    }

    return { ...budget, setTotalPoints }
}
