import type { ClassPreset } from "@config/classPresets"
import { Button, Flex } from "@chakra-ui/react"
import { useState } from "react"
import {
    DEFAULT_ALL_BOARDS_SEARCH_SECONDS,
    formatSearchTime,
} from "@planner/config/searchTime"
import { usePriorityOptimizer } from "@planner/hooks/usePriorityOptimizer"
import { ProgressBar } from "@common/ProgressBar"
import { SearchTimeSelect } from "@planner/shared/SearchTimeSelect"
import { StatusText } from "@common/StatusText"
import { ShortfallWarning } from "./ShortfallWarning"

type PriorityOptimizerProps = {
    classPreset: ClassPreset
    totalPoints: number
    onComplete: (applyResults: () => void) => void
}

// Builds routes on all four boards from the priority settings.
export const PriorityOptimizer = ({
    classPreset,
    totalPoints,
    onComplete,
}: PriorityOptimizerProps) => {
    const { isOptimizing, progress, message, shortfall, optimize, cancel } =
        usePriorityOptimizer({
            classPreset: classPreset,
            totalPoints: totalPoints,
            onComplete: onComplete,
        })

    const [searchSeconds, setSearchSeconds] = useState(
        DEFAULT_ALL_BOARDS_SEARCH_SECONDS,
    )

    const handleOptimize = () => {
        optimize(searchSeconds)
    }

    return (
        <Flex flexDir="column" gap="2">
            {isOptimizing ? (
                <Flex flexDir="column" gap="2">
                    <Flex alignItems="center" gap="3">
                        <Flex flex="1">
                            <StatusText tone="muted">
                                {progress
                                    ? `Searching… ${formatSearchTime(progress.elapsedMs / 1000)} of ${formatSearchTime(progress.timeBudgetMs / 1000)} · ${progress.pointsUsed} points used`
                                    : "Preparing all-board optimization…"}
                            </StatusText>
                        </Flex>

                        <Button variant="secondary" size="sm" onClick={cancel}>
                            Cancel
                        </Button>
                    </Flex>

                    <ProgressBar
                        label="Search time used"
                        value={
                            progress
                                ? (progress.elapsedMs / progress.timeBudgetMs) *
                                  100
                                : 0
                        }
                    />
                </Flex>
            ) : (
                <Flex gap="2">
                    <Button
                        variant="primary"
                        flex="1"
                        disabled={totalPoints <= 0}
                        onClick={handleOptimize}
                    >
                        Optimize all boards
                    </Button>

                    <SearchTimeSelect
                        value={searchSeconds}
                        onChange={setSearchSeconds}
                    />
                </Flex>
            )}

            {message && <StatusText tone="muted">{message}</StatusText>}

            {shortfall && <ShortfallWarning shortfall={shortfall} />}
        </Flex>
    )
}
