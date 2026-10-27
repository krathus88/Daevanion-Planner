import { Box, Icon } from "@chakra-ui/react"
import type { GameGap } from "@planner/logic/gameGaps"
import { LuMinus, LuPlus } from "react-icons/lu"
import { markerBottomOnCell, markerInline } from "./markerPlacement"

type GameGapMarkerProps = {
    gap: GameGap
    inline?: boolean
}

// "+" still to acquire in game, "−" acquired in game but not planned.
export const GameGapMarker = ({ gap, inline = false }: GameGapMarkerProps) => {
    return (
        <Box
            as="span"
            {...(inline ? markerInline : markerBottomOnCell)}
            boxSize="4"
            display={inline ? "inline-flex" : "flex"}
            alignItems="center"
            justifyContent="center"
            bg={gap === "missing" ? "board.gameMissing" : "board.gameExtra"}
            borderWidth="2px"
            borderColor="board.ink"
            borderRadius="full"
            color="board.ink"
            pointerEvents="none"
            aria-hidden="true"
        >
            <Icon boxSize="2.5" strokeWidth="4">
                {gap === "missing" ? <LuPlus /> : <LuMinus />}
            </Icon>
        </Box>
    )
}
