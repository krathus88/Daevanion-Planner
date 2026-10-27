import { Flex, Text } from "@chakra-ui/react"
import { BOARD_NAMES, type BoardId } from "@config/boards"
import { GameGapMarker } from "@planner/board/cell/GameGapMarker"
import { useBoard } from "@planner/context/boardContext"
import { getBoardGaps } from "./screenshotResults"

type GameCheckResultRowProps = {
    boardId: BoardId
}

// One board read: how far the game is from that board's plan.
export const GameCheckResultRow = ({ boardId }: GameCheckResultRowProps) => {
    const board = useBoard()

    const gaps = getBoardGaps(board, boardId)
    const matches = gaps && gaps.missing.length === 0 && gaps.extra.length === 0

    return (
        <Flex
            px="3"
            py="2"
            flexWrap="wrap"
            alignItems="center"
            justifyContent="space-between"
            columnGap="4"
            rowGap="1"
            layerStyle="card"
        >
            <Text fontWeight="semibold">
                {BOARD_NAMES[boardId]}
                {boardId === board.layoutName && (
                    <Text as="span" color="app.subtle" fontWeight="normal">
                        {" "}
                        · this board
                    </Text>
                )}
            </Text>

            {gaps && matches && (
                <Text color="app.success" fontSize="sm">
                    Matches the plan
                </Text>
            )}

            {gaps && !matches && (
                <Flex columnGap="3" color="app.muted" fontSize="sm">
                    {gaps.missing.length > 0 && (
                        <Text>
                            <GameGapMarker gap="missing" inline />
                            {gaps.missing.length} to acquire
                        </Text>
                    )}

                    {gaps.extra.length > 0 && (
                        <Text>
                            <GameGapMarker gap="extra" inline />
                            {gaps.extra.length} not planned
                        </Text>
                    )}
                </Flex>
            )}
        </Flex>
    )
}
