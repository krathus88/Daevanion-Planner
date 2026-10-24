import { Box } from "@chakra-ui/react"

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
