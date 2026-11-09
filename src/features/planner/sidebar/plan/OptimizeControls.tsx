import { Button, Flex } from "@chakra-ui/react"
import { isMainBoard } from "@config/boards"
import { useState } from "react"
import { DEFAULT_STALL_SECONDS } from "@planner/config/searchTime"
import { useBoard } from "@planner/context/boardContext"
import {
    formatOptionsChecked,
    idleStatus,
    improvementStatus,
} from "@planner/logic/improvementStatus"
import { formatPlannerDuration } from "@planner/logic/plannerLogic"
import { SearchTimeSelect } from "@planner/shared/SearchTimeSelect"
import { StatusText } from "@common/StatusText"

export const OptimizeControls = () => {
    const { layoutName, planner, wants } = useBoard()

    const [stallSeconds, setStallSeconds] = useState(DEFAULT_STALL_SECONDS)

    const findPath = () => {
        planner.optimizePlanner(stallSeconds * 1000)
    }

    const progress = planner.optimizationProgress

    if (planner.isOptimizing) {
        return (
            <Flex flexDir="column" gap="2">
                <StatusText tone="muted">
                    {planner.isStopping
                        ? "Stopping… finishing the best route so far"
                        : progress == null
                          ? "Starting the route search…"
                          : `Checking routes · ${formatOptionsChecked(progress.attempts)} · ${formatPlannerDuration(progress.elapsedMs)}`}
                </StatusText>

                <StatusText tone="muted">
                    {improvementStatus({
                        finds: planner.routeFinds,
                        noun: "route",
                    })}
                </StatusText>

                {progress != null && (
                    <StatusText tone="muted">
                        {idleStatus(
                            progress.idleMs,
                            stallSeconds * 1000,
                            "route",
                        )}
                    </StatusText>
                )}

                <Flex gap="2">
                    <Button
                        variant="primary"
                        size="sm"
                        flex="1"
                        loading={planner.isStopping}
                        loadingText="Stopping"
                        title="Stop now and keep the best route so far"
                        onClick={planner.stopOptimization}
                    >
                        Stop & keep
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        flex="1"
                        onClick={planner.cancelOptimization}
                    >
                        Cancel
                    </Button>
                </Flex>
            </Flex>
        )
    }

    return (
        <Flex gap="2">
            <Button
                variant="primary"
                size="sm"
                flex="1"
                disabled={
                    isMainBoard(layoutName) &&
                    planner.targetCells.size === 0 &&
                    wants.needCells.size === 0
                }
                onClick={findPath}
            >
                Find a good path
            </Button>

            <SearchTimeSelect
                size="sm"
                value={stallSeconds}
                onChange={setStallSeconds}
            />
        </Flex>
    )
}
