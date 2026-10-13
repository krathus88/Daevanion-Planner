import type { ClassPreset } from "@config/classPresets"
import { Button, Flex } from "@chakra-ui/react"
import { useState } from "react"
import {
    DEFAULT_ALL_BOARDS_SEARCH_SECONDS,
    formatSearchTime,
} from "@planner/config/searchTime"
import { useOptimizeAllBoards } from "@planner/hooks/useOptimizeAllBoards"
import { ProgressBar } from "@common/ProgressBar"
import { SearchTimeSelect } from "@planner/shared/SearchTimeSelect"
import { StatusText } from "@common/StatusText"
import { ShortfallWarning } from "./ShortfallWarning"

type OptimizeAllBoardsProps = {
    classPreset: ClassPreset
    totalPoints: number
    onComplete: (applyResults: () => void) => void
}

export const OptimizeAllBoards = ({
    classPreset,
    totalPoints,
    onComplete,
}: OptimizeAllBoardsProps) => {
    const {
        isOptimizing,
        progress,
        message,
        shortfall,
        optimizeAll,
        cancel,
    } = useOptimizeAllBoards({
            classPreset: classPreset,
            totalPoints: totalPoints,
            onComplete: onComplete,
        })

    const [searchSeconds, setSearchSeconds] = useState(
        DEFAULT_ALL_BOARDS_SEARCH_SECONDS,
    )

    const handleOptimize = () => {
        optimizeAll(searchSeconds)
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
