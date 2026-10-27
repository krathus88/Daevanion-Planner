import { Box } from "@chakra-ui/react"
import type { GameGap } from "@planner/logic/gameGaps"

type GameGapOutlineProps = {
    gap: GameGap
}

// Dashed frame around a node that differs in game, so it stands out.
export const GameGapOutline = ({ gap }: GameGapOutlineProps) => {
    return (
        <Box
            pos="absolute"
            inset="0"
            zIndex="board.marker"
            borderWidth="2px"
            borderStyle="dashed"
            borderColor={
                gap === "missing" ? "board.gameMissing" : "board.gameExtra"
            }
            borderRadius="md"
            pointerEvents="none"
            aria-hidden="true"
        />
    )
}
