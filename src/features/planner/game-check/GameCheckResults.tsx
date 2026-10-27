import { Flex, Text } from "@chakra-ui/react"
import type { ScreenshotResult } from "@planner/hooks/useGameScreenshots"
import { GameCheckResultRow } from "./GameCheckResultRow"
import { groupResults } from "./screenshotResults"

type GameCheckResultsProps = {
    results: ScreenshotResult[]
}

export const GameCheckResults = ({ results }: GameCheckResultsProps) => {
    const { boardIds, skippedFiles } = groupResults(results)

    return (
        <Flex flexDir="column" gap="3">
            {boardIds.length > 0 && (
                <Flex flexDir="column" gap="2">
                    {boardIds.map((boardId) => (
                        <GameCheckResultRow key={boardId} boardId={boardId} />
                    ))}
                </Flex>
            )}

            {skippedFiles.length > 0 && (
                <Text textStyle="hint">
                    No whole board found in {skippedFiles.join(", ")}.
                </Text>
            )}

            {boardIds.length > 0 && (
                <Text textStyle="hint">
                    Open a board to see its nodes marked. A newer screenshot of
                    a board replaces the older one.
                </Text>
            )}
        </Flex>
    )
}
