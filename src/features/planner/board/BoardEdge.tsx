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
    const thickness = isActive ? "1" : "1px"

    // Vertical lines are drawn upright, not rotated: a rotated hairline can
    // vanish when a large board like Ariel is scaled down to fit.
    return (
        <Box
            pos="absolute"
            zIndex="board.edge"
            w={horizontal ? undefined : thickness}
            h={horizontal ? thickness : undefined}
            // Placed from the computed cell grid, so these go in style.
            style={{
                left: horizontal ? x : x - 1,
                top: horizontal ? y - 1 : y,
                width: horizontal ? CELL_PITCH : undefined,
                height: horizontal ? undefined : CELL_PITCH,
            }}
            bg={isActive ? "board.edgeActive" : "board.edge"}
            borderRadius="full"
            boxShadow={isActive ? "board.edge" : "none"}
            aria-hidden="true"
        />
    )
}
