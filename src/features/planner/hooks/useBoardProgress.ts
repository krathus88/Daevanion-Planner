import { useState } from "react"
import type { LayoutType } from "@planner/config/layouts"
import {
    writeBoardProgress,
    type ActivePlanner,
    type BoardProgress,
} from "@planner/storage/boardStorage"

type UseBoardProgressOptions = {
    classId: string
    layoutName: LayoutType
    initial: BoardProgress | null
    availablePoints: number
    excludeStart: (keys: string[]) => string[]
    setMessage: (message: string) => void
}

// The board's saved progress: the hand-picked nodes and the planner route.
// Every change is written back with persistProgress.
export const useBoardProgress = ({
    classId,
    layoutName,
    initial,
    availablePoints,
    excludeStart,
    setMessage,
}: UseBoardProgressOptions) => {
    const [selectedCells, setSelectedCells] = useState(
        () => new Set(excludeStart(initial?.selectedCells ?? [])),
    )
    const [targetCells, setTargetCells] = useState(
        () => new Set(excludeStart(initial?.targetCells ?? [])),
    )
    const [plannedPath, setPlannedPath] = useState(
        () => new Set(excludeStart(initial?.plannedPath ?? [])),
    )
    const [plannedCost, setPlannedCost] = useState(
        () => initial?.plannedCost ?? null,
    )
    const [activePlanner, setActivePlanner] = useState<ActivePlanner | null>(
        () => initial?.activePlanner ?? null,
    )

    // Writes the current progress with `updates` applied. Returns the error,
    // if any, after showing it.
    const persistProgress = (updates: Partial<BoardProgress> = {}) => {
        const progress: BoardProgress = {
            selectedCells: [...selectedCells],
            availablePoints: availablePoints,
            targetCells: [...targetCells],
            plannedPath: [...plannedPath],
            plannedCost: plannedCost,
            activePlanner: activePlanner,
            ...updates,
        }
        const error = writeBoardProgress(classId, layoutName, progress)
        if (error) {
            setMessage(error)
        }

        return error
    }

    return {
        selectedCells: selectedCells,
        setSelectedCells: setSelectedCells,
        targetCells: targetCells,
        setTargetCells: setTargetCells,
        plannedPath: plannedPath,
        setPlannedPath: setPlannedPath,
        plannedCost: plannedCost,
        setPlannedCost: setPlannedCost,
        activePlanner: activePlanner,
        setActivePlanner: setActivePlanner,
        persistProgress: persistProgress,
    }
}

export type BoardProgressState = ReturnType<typeof useBoardProgress>
