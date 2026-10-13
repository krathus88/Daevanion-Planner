import { Button, Flex, Text } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { Card } from "@common/Card"
import { SharedBudgetField } from "@planner/shared/SharedBudgetField"
import { StatTile } from "@common/StatTile"

export const ManualPanel = () => {
    const { manual } = useBoard()

    return (
        <Flex flexDir="column" gap="4">
            <SharedBudgetField />

            <Card flexDir="row">
                <StatTile label="Nodes" value={manual.selectedCells.size} />

                <StatTile label="Spent" value={manual.spentPoints} />

                <StatTile
                    label="Remaining"
                    tone={manual.remainingPoints < 0 ? "danger" : undefined}
                    value={manual.remainingPoints}
                />
            </Card>

            <Flex flexWrap="wrap" gap="2">
                <Button
                    variant="danger"
                    size="xs"
                    disabled={manual.selectedCells.size === 0}
                    onClick={manual.resetSelection}
                >
                    Reset selection
                </Button>

                {manual.boardUndo && (
                    <Button
                        variant="info"
                        size="xs"
                        onClick={manual.restoreSelection}
                    >
                        Restore previous
                    </Button>
                )}
            </Flex>

            <Text textStyle="hint">
                Click an affordable node to add it with the lowest-cost
                connection. Save boards from the Saved tab.
            </Text>
        </Flex>
    )
}
