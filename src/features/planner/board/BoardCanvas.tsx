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
            w={{ base: "full", xl: "board" }}
            minW="0"
            maxW="board"
            // Centred when the sidebar stacks below it.
            alignSelf={{ base: "center", xl: "auto" }}
            // Keeps its width beside the sidebar and only shrinks when space
            // runs out; the sidebar takes the rest.
            flex={{ base: "1", xl: "0 1 auto" }}
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
