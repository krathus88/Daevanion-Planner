import type { ClassPreset } from "@config/classPresets"
import { useState } from "react"
import { getStart, keyOf, type Position } from "@planner/config/boardConfig"
import type { BoardId } from "@config/boards"
import type { BoardLayout } from "@planner/config/layouts"
import { compareWithGame } from "@planner/logic/gameGaps"
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
import { useBoardWants } from "./useBoardWants"
import type { GameCheck } from "./useGameCheck"
import { useManualBoard } from "./useManualBoard"
import { usePlannerRoute } from "./usePlannerRoute"
import { useSharedBudget } from "./useSharedBudget"

export type UseBoardStateOptions = {
    layout: BoardLayout
    layoutName: BoardId
    classPreset: ClassPreset
    gameCheck: GameCheck
    view: BoardView
    sidebarTab: SidebarTab
    onViewChange: (view: BoardView) => void
    onSidebarTabChange: (tab: SidebarTab) => void
}

const readStoredBoard = (classId: string, layoutName: BoardId) => {
    return {
        progress: readBoardProgress(classId, layoutName),
        boardUndo: readBoardUndo(classId, layoutName),
        plannerUndo: readPlannerUndo(classId, layoutName),
        plannerHistory: readPlannerHistory(classId, layoutName),
        savedBoards: readSavedBoards(classId, layoutName),
        savedPlanners: readSavedPlanners(classId, layoutName),
    }
}

export const useBoardState = ({
    layout,
    layoutName,
    classPreset,
    gameCheck,
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
    const wants = useBoardWants(classPreset, layoutName)
    const planner = usePlannerRoute({
        classPreset: classPreset,
        layoutName: layoutName,
        layout: layout,
        start: start,
        progress: progress,
        needCells: wants.needCells,
        preferred: wants.preferred,
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
    const selectedForView =
        view === "planner" ? planner.plannedPath : manual.selectedCells
    const gameAcquired = gameCheck.readings[layoutName]

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
        selectedForView: selectedForView,
        gameCheck: gameCheck,
        // Null until a screenshot of this board was read.
        gameGaps: gameAcquired
            ? compareWithGame(layout, gameAcquired, selectedForView)
            : null,
        budget: {
            totalPoints: budget.totalPoints,
            usedByOtherBoards: budget.usedByOtherBoards,
            availablePoints: budget.availablePoints,
            updateTotalPoints: updateTotalPoints,
        },
        manual: manual,
        planner: planner,
        wants: wants,
    }
}

export type BoardState = ReturnType<typeof useBoardState>
