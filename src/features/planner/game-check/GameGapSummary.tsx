import { Flex, Text } from "@chakra-ui/react"
import type { GameGaps } from "@planner/logic/gameGaps"
import { GameGapList } from "./GameGapList"

type GameGapSummaryProps = {
    gaps: GameGaps
}

export const GameGapSummary = ({ gaps }: GameGapSummaryProps) => {
    if (gaps.missing.length === 0 && gaps.extra.length === 0) {
        return (
            <Text color="app.success" fontSize="sm">
                The game matches this plan.
            </Text>
        )
    }

    return (
        <Flex flexDir="column" gap="3">
            {gaps.missing.length > 0 && (
                <GameGapList
                    gap="missing"
                    title="Still to acquire in game"
                    cells={gaps.missing}
                />
            )}

            {gaps.extra.length > 0 && (
                <GameGapList
                    gap="extra"
                    title="Acquired in game, not in this plan"
                    cells={gaps.extra}
                />
            )}
        </Flex>
    )
}
