import { Box } from "@chakra-ui/react"
import { markerInline, markerOnCell } from "./markerPlacement"

type NeedMarkerProps = {
    inline?: boolean
}

export const NeedMarker = ({ inline = false }: NeedMarkerProps) => {
    return (
        <Box
            as="span"
            {...(inline ? markerInline : markerOnCell)}
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
