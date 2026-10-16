import { Box } from "@chakra-ui/react"

// The dot in a node's corner that marks it as needed by Route preferences,
// apart from the yellow dot of a target you clicked.
export const NeedMarker = () => {
    return (
        <Box
            pos="absolute"
            top="board.markerInset"
            right="board.markerInset"
            zIndex="board.marker"
            boxSize="3"
            bg="board.needDot"
            borderWidth="2px"
            borderColor="board.ink"
            borderRadius="full"
            boxShadow="board.need"
            pointerEvents="none"
            aria-hidden="true"
        />
    )
}
