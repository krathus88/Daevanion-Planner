import type { ClassPreset } from "@config/classPresets"
import { useState } from "react"
import { getStart, keyOf, type Position } from "@planner/config/boardConfig"
import type { BoardLayout, LayoutType } from "@planner/config/layouts"
import {
    resolveAbilitiesByPosition,
    validateLayoutBonuses,
} from "@planner/logic/abilityAssignments"
import {
    readBoardProgress,
    readBoardUndo,
    readPlannerHistory,
    readPlannerUndo,
    readSavedBoards,
    readSavedPlanners,
} from "@planner/storage/boardStorage"
import type { BoardView, SidebarTab } from "../types"
import { useBoardProgress } from "./useBoardProgress"
import { useManualBoard } from "./useManualBoard"
import { usePlannerRoute } from "./usePlannerRoute"
import { useSharedBudget } from "./useSharedBudget"

export type UseBoardStateOptions = {
    layout: BoardLayout
    layoutName: LayoutType
    classPreset: ClassPreset
    view: BoardView
    sidebarTab: SidebarTab
    onViewChange: (view: BoardView) => void
    onSidebarTabChange: (tab: SidebarTab) => void
}

const readStoredBoard = (classId: string, layoutName: LayoutType) => {
    return {
        progress: readBoardProgress(classId, layoutName),
        boardUndo: readBoardUndo(classId, layoutName),
        plannerUndo: readPlannerUndo(classId, layoutName),
        plannerHistory: readPlannerHistory(classId, layoutName),
        savedBoards: readSavedBoards(classId, layoutName),
        savedPlanners: readSavedPlanners(classId, layoutName),
    }
}

// Everything one board shows and does, shared through BoardContext.
export const useBoardState = ({
    layout,
    layoutName,
    classPreset,
    view,
    sidebarTab,
    onViewChange,
    onSidebarTabChange,
}: UseBoardStateOptions) => {
    const classId = classPreset.id
    const start = getStart(layout)
    const startKey = keyOf(start)

    const excludeStart = (keys: string[]) => {
        return keys.filter((key) => key !== startKey)
    }

    const [stored] = useState(() => readStoredBoard(classId, layoutName))
    const [message, setMessage] = useState(() =>
        Object.values(stored)
            .map((read) => read.error)
            .filter(Boolean)
            .join(" "),
    )

    const budget = useSharedBudget(classId, layoutName)
    const progress = useBoardProgress({
        classId: classId,
        layoutName: layoutName,
        initial: stored.progress.value,
        availablePoints: budget.availablePoints,
        excludeStart: excludeStart,
        setMessage: setMessage,
    })
    const planner = usePlannerRoute({
        classId: classId,
        layoutName: layoutName,
        layout: layout,
        start: start,
        progress: progress,
        availablePoints: budget.availablePoints,
        initialUndo: stored.plannerUndo.value,
        initialSaved: stored.savedPlanners.value ?? [],
        initialHistory: stored.plannerHistory.value ?? [],
        excludeStart: excludeStart,
        setMessage: setMessage,
        setView: onViewChange,
    })
    const manual = useManualBoard({
        classId: classId,
        layoutName: layoutName,
        layout: layout,
        start: start,
        progress: progress,
        availablePoints: budget.availablePoints,
        initialUndo: stored.boardUndo.value,
        initialSaved: stored.savedBoards.value ?? [],
        excludeStart: excludeStart,
        setMessage: setMessage,
        cancelOptimization: planner.cancelOptimization,
    })

    const updateTotalPoints = (value: number) => {
        const error = budget.setTotalPoints(value)
        if (error) {
            setMessage(error)
        }
    }

    const changeView = (nextView: BoardView) => {
        planner.cancelOptimization()
        onViewChange(nextView)
        setMessage("")
    }

    const selectCell = (position: Position) => {
        if (view === "planner") {
            planner.toggleTarget(position)
        } else {
            manual.selectCell(position)
        }
    }

    validateLayoutBonuses(layout, layoutName)

    const abilitiesByPosition = resolveAbilitiesByPosition(
        layout,
        layoutName,
        classPreset,
    )

    return {
        layout: layout,
        layoutName: layoutName,
        classPreset: classPreset,
        view: view,
        changeView: changeView,
        sidebarTab: sidebarTab,
        changeSidebarTab: onSidebarTabChange,
        message: message,
        abilitiesByPosition: abilitiesByPosition,
        selectCell: selectCell,
        // The nodes drawn as taken: the route in Planner, the picks in Manual.
        selectedForView:
            view === "planner" ? planner.plannedPath : manual.selectedCells,
        budget: {
            totalPoints: budget.totalPoints,
            usedByOtherBoards: budget.usedByOtherBoards,
            availablePoints: budget.availablePoints,
            updateTotalPoints: updateTotalPoints,
        },
        manual: manual,
        planner: planner,
    }
}

export type BoardState = ReturnType<typeof useBoardState>
