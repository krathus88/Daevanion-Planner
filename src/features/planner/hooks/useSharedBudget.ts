import { useEffect, useState } from "react"
import { isMainBoard, type BoardId } from "@config/boards"
import {
    readArielSettings,
    writeArielSettings,
} from "@planner/storage/arielSettings"
import {
    readRouteCostOfOtherBoards,
    readSharedTotalPoints,
    subscribeToBoardStorage,
    writeSharedTotalPoints,
} from "@planner/storage/boardStorage"
import { subscribeToClassSettings } from "@planner/storage/classSettings"

type SharedBudget = {
    totalPoints: number
    usedByOtherBoards: number
    // What this board's route may spend: the shared total minus the other
    // boards' current routes.
    availablePoints: number
}

const readBudget = (classId: string, layout: BoardId): SharedBudget => {
    // Ariel spends its own points, which no other board uses.
    if (!isMainBoard(layout)) {
        let points = 0
        try {
            points = readArielSettings(classId).points
        } catch {
            // Unreadable settings leave nothing to spend.
        }

        return {
            totalPoints: points,
            usedByOtherBoards: 0,
            availablePoints: points,
        }
    }

    const totalPoints = readSharedTotalPoints(classId)
    const usedByOtherBoards = readRouteCostOfOtherBoards(classId, layout)
    return {
        totalPoints: totalPoints,
        usedByOtherBoards: usedByOtherBoards,
        availablePoints: Math.max(0, totalPoints - usedByOtherBoards),
    }
}

// One point budget shared by every main board and by the All boards tab;
// Ariel has its own.
export const useSharedBudget = (classId: string, layout: BoardId) => {
    const [budget, setBudget] = useState(() => readBudget(classId, layout))

    useEffect(() => {
        const refresh = () => {
            setBudget(readBudget(classId, layout))
        }
        const unsubscribeBoards = subscribeToBoardStorage(refresh)
        const unsubscribeSettings = subscribeToClassSettings(classId, refresh)

        return () => {
            unsubscribeBoards()
            unsubscribeSettings()
        }
    }, [classId, layout])

    const setTotalPoints = (totalPoints: number) => {
        let error: string | null
        if (isMainBoard(layout)) {
            error = writeSharedTotalPoints(classId, totalPoints)
        } else {
            try {
                error = writeArielSettings(classId, {
                    ...readArielSettings(classId),
                    points: totalPoints,
                })
            } catch (readError) {
                error =
                    readError instanceof Error
                        ? readError.message
                        : "Could not read Ariel settings."
            }
        }

        setBudget(readBudget(classId, layout))
        return error
    }

    return { ...budget, setTotalPoints: setTotalPoints }
}
