import { Flex } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
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
    } = useBoard()

    const isManual = view === "board"

    return (
        <Flex
            w="full"
            minW="0"
            maxW={{ xl: "board" }}
            flex="1"
            flexDir="column"
            alignItems="stretch"
            gap="3"
        >
            <BoardGrid
                abilitiesByPosition={abilitiesByPosition}
                availablePoints={isManual ? manual.remainingPoints : 0}
                layout={layout}
                mode={isManual ? "interactive" : "planner"}
                selectedCells={selectedForView}
                targetCells={isManual ? new Set() : planner.targetCells}
                onSelect={selectCell}
            />

            <BoardLegend layout={layout} />
        </Flex>
    )
}
