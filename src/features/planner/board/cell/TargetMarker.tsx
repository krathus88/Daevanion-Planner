import { Box } from "@chakra-ui/react"

export const TargetMarker = () => {
    return (
        <Box
            pos="absolute"
            top="board.markerInset"
            right="board.markerInset"
            zIndex="board.marker"
            boxSize="3"
            bg="board.targetDot"
            borderWidth="2px"
            borderColor="board.ink"
            borderRadius="full"
            boxShadow="board.target"
            pointerEvents="none"
            aria-hidden="true"
        />
    )
}
