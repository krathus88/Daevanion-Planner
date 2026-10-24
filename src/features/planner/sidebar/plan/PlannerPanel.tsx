import { Button, Flex, Text } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { SharedBudgetField } from "@planner/shared/SharedBudgetField"
import { ActiveRoute } from "./ActiveRoute"
import { BoardPriorities } from "./BoardPriorities"
import { RouteCard } from "./RouteCard"

export const PlannerPanel = () => {
    const { planner } = useBoard()

    return (
        <Flex flexDir="column" gap="4">
            <ActiveRoute />

            <SharedBudgetField disabled={planner.isOptimizing} />

            <BoardPriorities />

            <RouteCard />

            <Flex flexWrap="wrap" gap="2">
                <Button
                    variant="danger"
                    size="xs"
                    disabled={
                        planner.targetCells.size === 0 || planner.isOptimizing
                    }
                    onClick={planner.clearPlanner}
                >
                    Clear planner
                </Button>

                {planner.plannerUndo && (
                    <Button
                        variant="info"
                        size="xs"
                        onClick={planner.restorePlanner}
                    >
                        Restore previous
                    </Button>
                )}
            </Flex>

            <Text textStyle="hint">
                Click the nodes you need, then find a path to them.
            </Text>
        </Flex>
    )
}
