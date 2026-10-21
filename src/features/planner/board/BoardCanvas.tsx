import { isMainBoard } from "@config/boards"
import { useBoard } from "@planner/context/boardContext"
import { useArielSettings } from "@planner/hooks/useArielSettings"
import { arielMarkedCells } from "@planner/logic/arielRoute"
import { BoardColumn } from "./BoardColumn"
import { BoardGrid } from "./BoardGrid"
import { BoardLegend } from "./BoardLegend"

export const BoardCanvas = () => {
    const {
        layout,
        layoutName,
        classPreset,
        view,
        abilitiesByPosition,
        selectCell,
        selectedForView,
        manual,
        planner,
        wants,
    } = useBoard()
    const ariel = useArielSettings(classPreset.id)

    const isManual = view === "board"
    // Ariel has no Route preferences; its Best and Good costly stats get
    // the Need and Prefer markers instead.
    const arielCells = isMainBoard(layoutName)
        ? null
        : arielMarkedCells(ariel.settings.tiers)
    const neededCells = arielCells?.best ?? wants.needCells
    const preferredCells = arielCells?.good ?? wants.preferredCells

    return (
        <BoardColumn>
            <BoardGrid
                abilitiesByPosition={abilitiesByPosition}
                availablePoints={isManual ? manual.remainingPoints : 0}
                layout={layout}
                mode={isManual ? "interactive" : "planner"}
                selectedCells={selectedForView}
                targetCells={isManual ? new Set() : planner.targetCells}
                neededCells={isManual ? undefined : neededCells}
                preferredCells={isManual ? undefined : preferredCells}
                onSelect={selectCell}
            />

            <BoardLegend layout={layout} />
        </BoardColumn>
    )
}
