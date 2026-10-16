import { Button, Flex } from "@chakra-ui/react"
import { useState } from "react"
import { DEFAULT_SEARCH_SECONDS } from "@planner/config/searchTime"
import { useBoard } from "@planner/context/boardContext"
import { formatPlannerDuration } from "@planner/logic/plannerLogic"
import { SearchTimeSelect } from "@planner/shared/SearchTimeSelect"
import { StatusText } from "@common/StatusText"

// Starts the route search, or shows its progress while it runs.
export const OptimizeControls = () => {
    const { planner, wants } = useBoard()

    const [searchSeconds, setSearchSeconds] = useState(DEFAULT_SEARCH_SECONDS)

    const optimize = () => {
        planner.optimizePlanner(searchSeconds * 1000)
    }

    if (planner.isOptimizing) {
        return (
            <Flex flexDir="column" gap="2">
                <StatusText tone="muted">
                    {planner.optimizationProgress == null
                        ? "Starting the route search…"
                        : `Trying variations — ${planner.optimizationProgress.attempts.toLocaleString()} tried · ${formatPlannerDuration(planner.optimizationProgress.elapsedMs)}`}
                </StatusText>

                <Button
                    variant="secondary"
                    size="sm"
                    onClick={planner.cancelOptimization}
                >
                    Cancel
                </Button>
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
                    planner.targetCells.size === 0 && wants.needCells.size === 0
                }
                onClick={optimize}
            >
                Find a good path
            </Button>

            {planner.plannedCost !== null && (
                <Button variant="secondary" size="sm" onClick={optimize}>
                    Improve
                </Button>
            )}

            <SearchTimeSelect
                size="sm"
                value={searchSeconds}
                onChange={setSearchSeconds}
            />
        </Flex>
    )
}
