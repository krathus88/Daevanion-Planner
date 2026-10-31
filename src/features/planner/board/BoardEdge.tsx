import { Box } from "@chakra-ui/react"
import { memo } from "react"
import { CELL_PITCH, CELL_SIZE } from "./boardMetrics"

type BoardEdgeProps = {
    row: number
    column: number
    horizontal: boolean
    isActive: boolean
}

// memo: like BoardCell, a click only changes the edges it connects.
export const BoardEdge = memo(function BoardEdge({
    row,
    column,
    horizontal,
    isActive,
}: BoardEdgeProps) {
    const x = CELL_SIZE / 2 + column * CELL_PITCH
    const y = CELL_SIZE / 2 + row * CELL_PITCH
    const thickness = isActive ? "1" : "1px"

    // Not rotated: a rotated hairline can vanish when the board is scaled down.
    return (
        <Box
            pos="absolute"
            zIndex="board.edge"
            w={horizontal ? undefined : thickness}
            h={horizontal ? thickness : undefined}
            // Computed positions, so style rather than tokens.
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
})
