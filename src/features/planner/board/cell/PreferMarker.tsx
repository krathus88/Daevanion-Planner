import { Box } from "@chakra-ui/react"
import { markerInline, markerOnCell } from "./markerPlacement"

type PreferMarkerProps = {
    inline?: boolean
}

export const PreferMarker = ({ inline = false }: PreferMarkerProps) => {
    return (
        <Box
            as="span"
            {...(inline ? markerInline : markerOnCell)}
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
