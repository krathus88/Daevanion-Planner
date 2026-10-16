import { Box } from "@chakra-ui/react"

// A hollow ring in a node's corner: Route preferences prefer it, but the
// route only goes there when it costs no extra points.
export const PreferMarker = () => {
    return (
        <Box
            pos="absolute"
            top="board.markerInset"
            right="board.markerInset"
            zIndex="board.marker"
            boxSize="3"
            bg="board.ink"
            borderWidth="2px"
            borderColor="board.preferRing"
            borderRadius="full"
            pointerEvents="none"
            aria-hidden="true"
        />
    )
}
