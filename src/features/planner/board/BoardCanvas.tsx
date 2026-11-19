import { ARIEL_BOARD_ID, isStatBoard } from "@config/boards"
import { useBoard } from "@planner/context/boardContext"
import { useStatBoardSettings } from "@planner/hooks/useStatBoardSettings"
import { useHighlightedStat } from "@planner/hooks/useStatHighlight"
import {
    arielOrder,
    arielTiers,
    statMarkedCells,
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
    const statBoard = useStatBoardSettings(
        classPreset.id,
        isStatBoard(layoutName) ? layoutName : ARIEL_BOARD_ID,
    )
    const highlightedStat = useHighlightedStat()

    const isManual = view === "board"
    // Ariel and Azphel have no Route preferences; their Best/Good costly stats
    // get the markers.
    const statBoardCells = isStatBoard(layoutName)
        ? statMarkedCells(
              layoutName,
              arielTiers(statBoard.settings),
              arielOrder(statBoard.settings),
          )
        : null
    const neededCells = statBoardCells?.best ?? wants.needCells
    const preferredCells = statBoardCells?.good ?? wants.preferredCells
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
