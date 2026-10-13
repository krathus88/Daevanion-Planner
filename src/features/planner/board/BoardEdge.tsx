import { Box } from "@chakra-ui/react"
import { CELL_PITCH, CELL_SIZE } from "./boardMetrics"

type BoardEdgeProps = {
    row: number
    column: number
    horizontal: boolean
    isActive: boolean
}

// One line from a node to its right or lower neighbour.
export const BoardEdge = ({
    row,
    column,
    horizontal,
    isActive,
}: BoardEdgeProps) => {
    const x = CELL_SIZE / 2 + column * CELL_PITCH
    const y = CELL_SIZE / 2 + row * CELL_PITCH

    return (
        <Box
            pos="absolute"
            zIndex="board.edge"
            h={isActive ? "1" : "1px"}
            // Placed from the computed cell grid, so these go in style.
            style={{
                left: horizontal ? x : x - 1,
                top: horizontal ? y - 1 : y,
                width: CELL_PITCH,
            }}
            bg={isActive ? "board.edgeActive" : "board.edge"}
            borderRadius="full"
            boxShadow={isActive ? "board.edge" : "none"}
            transform={horizontal ? undefined : "rotate(90deg)"}
            transformOrigin="left center"
            aria-hidden="true"
        />
    )
}
