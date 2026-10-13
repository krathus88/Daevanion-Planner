import { Flex, Text } from "@chakra-ui/react"
import type { BoardWorkspaceProps } from "./BoardWorkspace"
import { Card, Hint, SharedBudgetField, ToneButton } from "./PanelKit"

type Props = Pick<
    BoardWorkspaceProps,
    | "remainingPoints"
    | "selectedCells"
    | "spentPoints"
    | "availablePoints"
    | "totalPoints"
    | "usedByOtherBoards"
    | "updateTotalPoints"
    | "resetSelection"
    | "boardUndo"
    | "restoreSelection"
>

export const BoardSelectionPanel = (props: Props) => {
    const {
        remainingPoints,
        selectedCells,
        spentPoints,
        availablePoints,
        totalPoints,
        usedByOtherBoards,
        updateTotalPoints,
        resetSelection,
        boardUndo,
        restoreSelection,
    } = props

    const stats = [
        { label: "Nodes", value: selectedCells.size },
        { label: "Spent", value: spentPoints },
        { label: "Remaining", value: remainingPoints },
    ]

    return (
        <Flex direction="column" gap="4">
            <SharedBudgetField
                availablePoints={availablePoints}
                idPrefix="board"
                onTotalChange={updateTotalPoints}
                totalPoints={totalPoints}
                usedByOtherBoards={usedByOtherBoards}
            />

            <Card direction="row" gap="3">
                {stats.map((stat) => (
                    <Flex
                        direction="column"
                        flex="1"
                        gap="0.5"
                        key={stat.label}
                    >
                        <Text color="app.subtle" fontSize="xs">
                            {stat.label}
                        </Text>
                        <Text
                            color={
                                stat.label === "Remaining" && stat.value < 0
                                    ? "app.danger"
                                    : "app.fg"
                            }
                            fontSize="lg"
                            fontWeight="semibold"
                            lineHeight="short"
                        >
                            {stat.value}
                        </Text>
                    </Flex>
                ))}
            </Card>

            <Flex gap="2" wrap="wrap">
                <ToneButton
                    disabled={selectedCells.size === 0}
                    onClick={resetSelection}
                    size="xs"
                    tone="danger"
                >
                    Reset selection
                </ToneButton>
                {boardUndo && (
                    <ToneButton
                        onClick={restoreSelection}
                        size="xs"
                        tone="info"
                    >
                        Restore previous
                    </ToneButton>
                )}
            </Flex>

            <Hint>
                Click an affordable node to add it with the lowest-cost
                connection. Save boards from the Saved tab.
            </Hint>
        </Flex>
    )
}
