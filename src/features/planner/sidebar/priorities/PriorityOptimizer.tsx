import type { ClassPreset } from "@config/classPresets"
import { Button, Flex } from "@chakra-ui/react"
import { useState } from "react"
import { DEFAULT_STALL_SECONDS } from "@planner/config/searchTime"
import { usePriorityOptimizer } from "@planner/hooks/usePriorityOptimizer"
import {
    idleStatus,
    improvementStatus,
    planPhaseStatus,
    planSearchHeadline,
} from "@planner/logic/improvementStatus"
import { ProgressBar } from "@common/ProgressBar"
import { SearchTimeSelect } from "@planner/shared/SearchTimeSelect"
import { StatusText } from "@common/StatusText"
import { ShortfallWarning } from "./ShortfallWarning"

type PriorityOptimizerProps = {
    classPreset: ClassPreset
    totalPoints: number
    onComplete: (applyResults: () => void) => void
}

export const PriorityOptimizer = ({
    classPreset,
    totalPoints,
    onComplete,
}: PriorityOptimizerProps) => {
    const {
        isOptimizing,
        isStopping,
        progress,
        message,
        shortfall,
        optimize,
        stop,
        cancel,
    } = usePriorityOptimizer({
        classPreset: classPreset,
        totalPoints: totalPoints,
        onComplete: onComplete,
    })

    const [stallSeconds, setStallSeconds] = useState(DEFAULT_STALL_SECONDS)

    const handleOptimize = () => {
        optimize(stallSeconds)
    }

    // The first plan has to finish before there's one to keep.
    const isBuilding = !progress || progress.phase === "build"

    return (
        <Flex flexDir="column" gap="2">
            {isOptimizing ? (
                <Flex flexDir="column" gap="2">
                    <Flex alignItems="center" gap="2">
                        <Flex flex="1">
                            <StatusText tone="muted">
                                {planSearchHeadline(progress, isStopping)}
                            </StatusText>
                        </Flex>

                        <Button
                            variant="primary"
                            size="sm"
                            loading={isStopping}
                            loadingText="Stopping"
                            disabled={isBuilding}
                            title={
                                isBuilding
                                    ? "Available once the first plan is ready"
                                    : "Stop now and keep the best plan so far"
                            }
                            onClick={stop}
                        >
                            Stop & keep
                        </Button>

                        <Button variant="secondary" size="sm" onClick={cancel}>
                            Cancel
                        </Button>
                    </Flex>

                    <ProgressBar
                        label="Time without a better plan"
                        value={
                            progress && !isBuilding
                                ? (progress.idleMs / progress.stallMs) * 100
                                : 0
                        }
                    />

                    {progress && (
                        <StatusText tone="muted">
                            {planPhaseStatus({
                                finds: progress.finds,
                                phase: progress.phase,
                                spendsLeftover: progress.spendsLeftover,
                            })}
                        </StatusText>
                    )}

                    {progress && !isBuilding && (
                        <StatusText tone="muted">
                            {idleStatus(
                                progress.idleMs,
                                progress.stallMs,
                                "plan",
                            )}
                        </StatusText>
                    )}

                    {progress?.finds.firstFoundMs != null && (
                        <StatusText tone="muted">
                            {improvementStatus({
                                finds: progress.finds,
                                noun: "plan",
                            })}
                        </StatusText>
                    )}
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
                        value={stallSeconds}
                        onChange={setStallSeconds}
                    />
                </Flex>
            )}

            {message && <StatusText tone="muted">{message}</StatusText>}

            {shortfall && <ShortfallWarning shortfall={shortfall} />}
        </Flex>
    )
}
