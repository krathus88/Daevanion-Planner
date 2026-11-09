import { Box } from "@chakra-ui/react"

// Frame around a node of the stat hovered in a priority list.
export const StatHighlightOutline = () => {
    return (
        <Box
            pos="absolute"
            inset="0"
            zIndex="board.marker"
            borderWidth="1px"
            borderColor="board.highlight"
            borderRadius="md"
            pointerEvents="none"
            aria-hidden="true"
            data-highlighted=""
        />
    )
}
