import { Flex, Text } from "@chakra-ui/react"
import { GameGapMarker } from "@planner/board/cell/GameGapMarker"
import { useBoard } from "@planner/context/boardContext"
import type { GameGap } from "@planner/logic/gameGaps"
import { countNodeNames } from "@planner/logic/nodeName"

type GameGapListProps = {
    gap: GameGap
    title: string
    // "row,column" keys, in grid order.
    cells: string[]
}

// One kind of gap: its marker, how many nodes, and their names.
export const GameGapList = ({ gap, title, cells }: GameGapListProps) => {
    const { layout, abilitiesByPosition } = useBoard()

    const names = countNodeNames(layout, abilitiesByPosition, cells)

    return (
        <Flex flexDir="column" gap="1">
            <Text fontSize="sm" fontWeight="semibold">
                <GameGapMarker gap={gap} inline />
                {title} · {cells.length}
            </Text>

            <Text color="app.muted" fontSize="sm">
                {names.join(", ")}
            </Text>
        </Flex>
    )
}
