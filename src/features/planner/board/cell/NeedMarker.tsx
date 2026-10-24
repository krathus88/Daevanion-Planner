import { Box } from "@chakra-ui/react"

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
