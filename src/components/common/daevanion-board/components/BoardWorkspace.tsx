import { Flex } from "@chakra-ui/react"
import { BoardControls } from "./BoardControls"
import type { BoardLayout } from "../config/layouts"
import type { PlannerProgress } from "../logic/plannerLogic"
import type { ClassPreset } from "../../../../config/classPresets"
import type {
    ActivePlanner,
    BoardUndo,
    PlannerUndo,
    SavedBoard,
    SavedPlanner,
} from "../storage/boardStorage"
import { BoardCanvas } from "./BoardCanvas"

export type BoardView = "board" | "planner"

export type BoardWorkspaceProps = {
    layout: BoardLayout
    view: BoardView
    changeView: (view: BoardView) => void
    remainingPoints: number
    abilitiesByPosition: Record<string, ClassPreset["abilities"][number]>
    handleCellSelect: (position: { row: number; column: number }) => void
    selectedForView: Set<string>
    targetCells: Set<string>
    classPreset: ClassPreset
    selectedCells: Set<string>
    spentPoints: number
    // This board's share of the shared total (total minus other boards).
    availablePoints: number
    totalPoints: number
    usedByOtherBoards: number
    updateTotalPoints: (value: number) => void
    boardSaveName: string
    setBoardSaveName: (value: string) => void
    saveBoard: () => void
    resetSelection: () => void
    boardUndo: BoardUndo | null
    restoreSelection: () => void
    savedBoards: SavedBoard[]
    loadBoard: (saved: SavedBoard) => void
    deleteBoard: (id: string) => void
    isOptimizing: boolean
    optimizePlanner: (timeBudgetMs?: number) => void
    plannedCost: number | null
    cancelOptimization: () => void
    clearPlanner: () => void
    plannerUndo: PlannerUndo | null
    restorePlanner: () => void
    activePlanner: ActivePlanner | null
    plannerSaveName: string
    setPlannerSaveName: (value: string) => void
    savePlanner: () => void
    savedPlanners: SavedPlanner[]
    loadPlanner: (saved: SavedPlanner, source: ActivePlanner["source"]) => void
    deletePlanner: (id: string) => void
    plannerHistory: SavedPlanner[]
    deletePlannerHistoryEntry: (id: string) => void
    optimizationProgress: PlannerProgress | null
    plannedPath: Set<string>
    message: string
    formatPlannerDuration: (milliseconds: number) => string
}

export const BoardWorkspace = (props: BoardWorkspaceProps) => {
    const {
        layout,
        view,
        remainingPoints,
        abilitiesByPosition,
        handleCellSelect,
        selectedForView,
        targetCells,
    } = props

    return (
        <Flex
            alignItems={{ base: "stretch", xl: "flex-start" }}
            direction={{ base: "column", xl: "row" }}
            gap={{ base: "5", xl: "6" }}
            width="100%"
        >
            <BoardCanvas
                layout={layout}
                view={view}
                remainingPoints={remainingPoints}
                abilitiesByPosition={abilitiesByPosition}
                onSelect={handleCellSelect}
                selectedCells={selectedForView}
                targetCells={targetCells}
            />

            <BoardControls {...props} />
        </Flex>
    )
}
