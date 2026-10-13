import { Flex, Text } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { Card } from "@common/Card"
import { StatTile } from "@common/StatTile"
import { OptimizeControls } from "./OptimizeControls"

// The route's required nodes and cost, with the controls that find it.
export const RouteCard = () => {
    const { budget, planner } = useBoard()

    const isOverBudget =
        planner.plannedCost !== null &&
        planner.plannedCost > budget.availablePoints

    return (
        <Card>
            <Flex gap="3">
                <StatTile
                    label="Required nodes"
                    value={planner.targetCells.size}
                />

                <StatTile
                    label="Route cost"
                    tone={
                        planner.plannedCost === null
                            ? undefined
                            : isOverBudget
                              ? "danger"
                              : "success"
                    }
                    value={
                        planner.plannedCost === null
                            ? "—"
                            : `${planner.plannedCost} / ${budget.availablePoints}`
                    }
                />
            </Flex>

            <OptimizeControls />

            {planner.plannedCost !== null && (
                <Text
                    color={isOverBudget ? "app.danger" : "app.success"}
                    fontSize="sm"
                >
                    {planner.plannedPath.size} nodes on route ·{" "}
                    {isOverBudget
                        ? `${planner.plannedCost - budget.availablePoints} points over budget`
                        : `${budget.availablePoints - planner.plannedCost} points left`}
                </Text>
            )}
        </Card>
    )
}
