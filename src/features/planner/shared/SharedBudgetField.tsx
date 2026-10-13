import { Flex, Text } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { PointsField } from "@common/PointsField"

// The shared Total points (same value as the All boards tab) and this
// board's share of it.
export const SharedBudgetField = ({ disabled }: { disabled?: boolean }) => {
    const { budget } = useBoard()

    return (
        <Flex flexDir="column" gap="1.5">
            <PointsField
                label="Total points (all boards)"
                value={budget.totalPoints}
                disabled={disabled}
                onChange={budget.updateTotalPoints}
            />

            <Flex justifyContent="space-between" textStyle="caption">
                <Text>Used by other boards · {budget.usedByOtherBoards}</Text>

                <Text>
                    Available here ·{" "}
                    <Text as="span" color="app.fg" fontWeight="semibold">
                        {budget.availablePoints}
                    </Text>
                </Text>
            </Flex>
        </Flex>
    )
}
