import { isMainBoard } from "@config/boards"
import { useBoard } from "@planner/context/boardContext"
import { useArielSettings } from "@planner/hooks/useArielSettings"
import { useHighlightedStat } from "@planner/hooks/useStatHighlight"
import {
    arielMarkedCells,
    arielOrder,
    arielTiers,
} from "@planner/logic/arielRoute"
import { gapsByCell } from "@planner/logic/gameGaps"
import { statCells } from "@planner/logic/statCells"
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
        gameGaps,
    } = useBoard()
    const ariel = useArielSettings(classPreset.id)
    const highlightedStat = useHighlightedStat()

    const isManual = view === "board"
    // Ariel has no Route preferences; its Best/Good costly stats get the markers.
    const arielCells = isMainBoard(layoutName)
        ? null
        : arielMarkedCells(
              arielTiers(ariel.settings),
              arielOrder(ariel.settings),
          )
    const neededCells = arielCells?.best ?? wants.needCells
    const preferredCells = arielCells?.good ?? wants.preferredCells
    const highlightedCells = highlightedStat
        ? statCells(layout, highlightedStat)
        : undefined

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
                gameGaps={gameGaps ? gapsByCell(gameGaps) : undefined}
                highlightedCells={highlightedCells}
                onSelect={selectCell}
            />

            <BoardLegend layout={layout} />
        </BoardColumn>
    )
}
