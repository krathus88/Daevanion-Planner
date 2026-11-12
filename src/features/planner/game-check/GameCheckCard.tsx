import { Button, Flex, Text } from "@chakra-ui/react"
import type { GameBoards } from "@account/game/gameSync"
import { Card } from "@common/Card"
import { BOARD_IDS } from "@config/boards"
import { useBoard } from "@planner/context/boardContext"
import { useGameBoards } from "@planner/hooks/useGameBoards"
import { pickCheckedBoards, toGameReadings } from "@planner/logic/gameBoards"
import { getRouteApi } from "@tanstack/react-router"
import { useState } from "react"
import { LuGamepad2, LuImageUp } from "react-icons/lu"
import { GameCheckDialog } from "./GameCheckDialog"
import { GameCheckResultRow } from "./GameCheckResultRow"
import { GameGapSummary } from "./GameGapSummary"
import { differsFromGame, pickBoardToShow } from "./screenshotResults"

const route = getRouteApi("/planner/$classId/$layout")

type GameCheckCardProps = {
    // "board" lists this board's gaps; "all" counts them for every board read.
    scope: "board" | "all"
}

const formatReadTime = (at: number) => {
    return new Date(at).toLocaleString([], {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    })
}

// Compares the plans with the game's boards: as the companion app read them
// while it runs, else from screenshots.
export const GameCheckCard = ({ scope }: GameCheckCardProps) => {
    const board = useBoard()
    const { layoutName, gameCheck, gameGaps } = board
    const navigate = route.useNavigate()
    const { classId } = route.useParams()
    const gameBoards = useGameBoards(classId)

    const [isDialogOpen, setIsDialogOpen] = useState(false)

    const readBoardIds = BOARD_IDS.filter((boardId) => {
        return gameCheck.readings[boardId]
    })
    const hasReading =
        scope === "board" ? gameGaps !== null : readBoardIds.length > 0
    const fromGame = gameBoards.length > 0

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

    // This board's card reads only the open board. All boards' reads every
    // board, then opens the first that differs from the game unless the open
    // one does, like the screenshot check.
    const handleGameCheck = (character: GameBoards) => {
        const readings = toGameReadings(character.boards)
        const boardIds = pickCheckedBoards(readings, scope, layoutName)

        for (const boardId of boardIds) {
            gameCheck.addReading(boardId, readings[boardId] ?? [])
        }

        if (scope === "board") {
            return
        }

        const boardToShow = pickBoardToShow(layoutName, boardIds, (boardId) => {
            return differsFromGame(board, boardId, readings)
        })

        if (boardToShow) {
            void navigate({
                to: "/planner/$classId/$layout",
                params: { classId: classId, layout: boardToShow },
                search: true,
                resetScroll: false,
            })
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

            {!hasReading && !fromGame && (
                <Text textStyle="hint">
                    Screenshot your Daevanion boards in game to see which nodes
                    you missed when copying{" "}
                    {scope === "board" ? "this plan" : "your plans"}.
                </Text>
            )}

            {fromGame && (
                <Text textStyle="hint">
                    Your boards as the companion app last saw them (
                    {formatReadTime(gameBoards[0].at)}), kept up to date while
                    it runs.
                </Text>
            )}

            <Flex flexWrap="wrap" alignItems="center" gap="2">
                {gameBoards.map((character) => (
                    <Button
                        key={`${character.server}:${character.name}`}
                        variant="info"
                        size="xs"
                        onClick={() => handleGameCheck(character)}
                    >
                        <LuGamepad2 />
                        Check {character.name}
                    </Button>
                ))}

                <Button
                    variant={fromGame ? "ghost" : "info"}
                    size="xs"
                    onClick={handleOpen}
                >
                    <LuImageUp />
                    {fromGame
                        ? "Use screenshots"
                        : hasReading
                          ? "Check new screenshots"
                          : "Check screenshots"}
                </Button>
            </Flex>

            <GameCheckDialog
                open={isDialogOpen}
                onOpenChange={setIsDialogOpen}
            />
        </Card>
    )
}
