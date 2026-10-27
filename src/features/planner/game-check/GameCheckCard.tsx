import { Button, Flex, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { BOARD_IDS } from "@config/boards"
import { useBoard } from "@planner/context/boardContext"
import { useState } from "react"
import { LuImageUp } from "react-icons/lu"
import { GameCheckDialog } from "./GameCheckDialog"
import { GameCheckResultRow } from "./GameCheckResultRow"
import { GameGapSummary } from "./GameGapSummary"

type GameCheckCardProps = {
    // "board" lists this board's gaps; "all" counts them for every board read.
    scope: "board" | "all"
}

// Compares the plans with screenshots of the game's boards.
export const GameCheckCard = ({ scope }: GameCheckCardProps) => {
    const { layoutName, gameCheck, gameGaps } = useBoard()

    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const readBoardIds = BOARD_IDS.filter((boardId) => {
        return gameCheck.readings[boardId]
    })
    const hasReading =
        scope === "board" ? gameGaps !== null : readBoardIds.length > 0

    const handleOpen = () => {
        setIsDialogOpen(true)
    }

    const handleClear = () => {
        if (scope === "board") {
            gameCheck.clearReading(layoutName)
        } else {
            gameCheck.clearAll()
        }
    }

    return (
        <Card>
            <Flex alignItems="center" justifyContent="space-between" gap="2">
                <Text textStyle="label">Check against the game</Text>

                {hasReading && (
                    <Button variant="ghost" size="xs" onClick={handleClear}>
                        {scope === "board" ? "Clear" : "Clear all"}
                    </Button>
                )}
            </Flex>

            {scope === "board" && gameGaps && (
                <GameGapSummary gaps={gameGaps} />
            )}

            {scope === "all" && hasReading && (
                <Flex flexDir="column" gap="2">
                    {readBoardIds.map((boardId) => (
                        <GameCheckResultRow key={boardId} boardId={boardId} />
                    ))}
                </Flex>
            )}

            {!hasReading && (
                <Text textStyle="hint">
                    Screenshot your Daevanion boards in game to see which nodes
                    you missed when copying{" "}
                    {scope === "board" ? "this plan" : "your plans"}.
                </Text>
            )}

            <Button
                variant="info"
                size="xs"
                alignSelf="flex-start"
                onClick={handleOpen}
            >
                <LuImageUp />
                {hasReading ? "Check new screenshots" : "Check screenshots"}
            </Button>

            <GameCheckDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </Card>
    )
}
