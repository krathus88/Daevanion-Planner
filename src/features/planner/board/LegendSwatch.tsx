import { Box } from "@chakra-ui/react"
import type { BoardNodeType } from "@planner/config/layouts"
import { DIAMOND } from "./cell/nodeStyles"

// A small sample of a node type's shape and colour.
export const LegendSwatch = ({ type }: { type: BoardNodeType }) => {
    if (type === "special") {
        return (
            <Box
                boxSize="4"
                flexShrink="0"
                bg="board.specialSwatch"
                clipPath={DIAMOND}
                aria-hidden="true"
            />
        )
    }

    if (type === "skill" || type === "passive") {
        return (
            <Box
                boxSize="3.5"
                flexShrink="0"
                bg="app.inset"
                borderWidth="2px"
                borderColor={
                    type === "passive" ? "board.passive" : "board.skill"
                }
                borderRadius="sm"
                aria-hidden="true"
            />
        )
    }

    return (
        <Box
            boxSize="2.5"
            flexShrink="0"
            bg="board.stat"
            borderWidth="1px"
            borderColor="board.statBorder"
            borderRadius="full"
            aria-hidden="true"
        />
    )
}
