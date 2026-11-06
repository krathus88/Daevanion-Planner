import type { ClassPreset } from "@config/classPresets"
import { Button, Flex } from "@chakra-ui/react"
import { useState } from "react"
import { DEFAULT_STALL_SECONDS } from "@planner/config/searchTime"
import { usePriorityOptimizer } from "@planner/hooks/usePriorityOptimizer"
import { SearchTimeSelect } from "@planner/shared/SearchTimeSelect"
import { StatusText } from "@common/StatusText"
import { PrioritySearchStatus } from "./PrioritySearchStatus"
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

    return (
        <Flex flexDir="column" gap="2">
            {isOptimizing ? (
                <PrioritySearchStatus
                    progress={progress}
                    isStopping={isStopping}
                    onStop={stop}
                    onCancel={cancel}
                />
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
