import { useBoard } from "@planner/context/boardContext"
import { BoardColumn } from "./BoardColumn"
import { BoardGrid } from "./BoardGrid"
import { BoardLegend } from "./BoardLegend"

export const BoardCanvas = () => {
    const {
        layout,
        view,
        abilitiesByPosition,
        selectCell,
        selectedForView,
        manual,
        planner,
        wants,
    } = useBoard()

    const isManual = view === "board"

    return (
        <BoardColumn>
            <BoardGrid
                abilitiesByPosition={abilitiesByPosition}
                availablePoints={isManual ? manual.remainingPoints : 0}
                layout={layout}
                mode={isManual ? "interactive" : "planner"}
                selectedCells={selectedForView}
                targetCells={isManual ? new Set() : planner.targetCells}
                neededCells={isManual ? undefined : wants.needCells}
                preferredCells={isManual ? undefined : wants.preferredCells}
                onSelect={selectCell}
            />

            <BoardLegend layout={layout} />
        </BoardColumn>
    )
}
