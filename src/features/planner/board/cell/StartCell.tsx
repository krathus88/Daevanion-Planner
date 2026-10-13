import { AbsoluteCenter, Box } from "@chakra-ui/react"
import { Tooltip } from "@ui/tooltip"
import type { BoardNodeAppearance } from "@planner/config/layouts"
import { CELL_BOX, START_SIZE } from "./nodeStyles"

export const StartCell = ({ node }: { node: BoardNodeAppearance }) => {
    return (
        <Box pos="relative" boxSize={CELL_BOX}>
            <Tooltip content={node.label} openDelay={100} showArrow>
                <AbsoluteCenter
                    zIndex="board.node"
                    boxSize={START_SIZE}
                    bgImage="board.start"
                    borderRadius="full"
                    boxShadow="board.start"
                    role="img"
                    aria-label={node.name}
                />
            </Tooltip>
        </Box>
    )
}
