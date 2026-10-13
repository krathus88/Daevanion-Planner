import { Box, Flex, Text } from "@chakra-ui/react"
import type { Position } from "../config/boardConfig"
import {
    POINTS_PER_NODE_TYPE,
    type BoardLayout,
    type BoardNodeType,
} from "../config/layouts"
import type { ClassAbility } from "../../../../config/classPresets"
import { BoardGrid } from "./BoardGrid"
import type { BoardView } from "./BoardWorkspace"

type BoardCanvasProps = {
    layout: BoardLayout
    view: BoardView
    remainingPoints: number
    abilitiesByPosition: Record<string, ClassAbility>
    onSelect: (position: Position) => void
    selectedCells: Set<string>
    targetCells: Set<string>
}

const LegendSwatch = ({ type }: { type: BoardNodeType }) => {
    if (type === "special") {
        return (
            <Box
                aria-hidden="true"
                background="#d9a441"
                boxSize="4"
                clipPath="polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)"
                flexShrink="0"
            />
        )
    }

    if (type === "skill" || type === "passive") {
        return (
            <Box
                aria-hidden="true"
                background="app.inset"
                borderColor={type === "passive" ? "green.400" : "blue.400"}
                borderRadius="sm"
                borderWidth="2px"
                boxSize="3.5"
                flexShrink="0"
            />
        )
    }

    return (
        <Box
            aria-hidden="true"
            background="rgba(255, 255, 255, 0.12)"
            borderColor="white"
            borderRadius="full"
            borderWidth="1px"
            boxSize="2.5"
            flexShrink="0"
        />
    )
}

export const BoardCanvas = ({
    layout,
    view,
    remainingPoints,
    abilitiesByPosition,
    onSelect,
    selectedCells,
    targetCells,
}: BoardCanvasProps) => (
    <Flex
        alignItems="stretch"
        direction="column"
        flex="1"
        gap="3"
        maxWidth={{ xl: "880px" }}
        minWidth="0"
        width="100%"
    >
        <BoardGrid
            availablePoints={view === "board" ? remainingPoints : 0}
            abilitiesByPosition={abilitiesByPosition}
            layout={layout}
            mode={view === "board" ? "interactive" : "planner"}
            onSelect={onSelect}
            selectedCells={selectedCells}
            targetCells={view === "planner" ? targetCells : new Set()}
        />

        <Flex
            alignItems="center"
            columnGap="4"
            rowGap="2"
            justifyContent="space-between"
            wrap="wrap"
        >
            <Flex columnGap="4" rowGap="2" wrap="wrap">
                {[
                    ...Object.entries(layout.specialNodes),
                    ["main", layout.mainNode] as const,
                ].map(([id, node]) => (
                    <Flex alignItems="center" gap="2" key={id}>
                        <LegendSwatch type={node.type} />
                        <Text color="app.muted" fontSize="xs">
                            {node.name}{" "}
                            <Text as="span" color="app.subtle">
                                · {POINTS_PER_NODE_TYPE[node.type]} pts
                            </Text>
                        </Text>
                    </Flex>
                ))}
            </Flex>

            <Text color="app.subtle" fontSize="xs">
                {layout.grid.length} × {layout.grid[0].length} grid
            </Text>
        </Flex>
    </Flex>
)
