import { Button, Flex } from "@chakra-ui/react"
import type { ReceivedProgress } from "@planner/hooks/usePriorityOptimizer"
import {
    advanceSearchClock,
    idleStatus,
    improvementStatus,
    planPhaseStatus,
    planSearchHeadline,
} from "@planner/logic/improvementStatus"
import { useNow } from "@timers/hooks/useNow"
import { ProgressBar } from "@common/ProgressBar"
import { StatusText } from "@common/StatusText"

type PrioritySearchStatusProps = {
    progress: ReceivedProgress | null
    isStopping: boolean
    onStop: () => void
    onCancel: () => void
}

// Mounted only while a search runs, so its clock ticks only then.
export const PrioritySearchStatus = ({
    progress,
    isStopping,
    onStop,
    onCancel,
}: PrioritySearchStatusProps) => {
    const now = useNow()

    const live = progress
        ? advanceSearchClock(progress, progress.receivedAt, now)
        : null
    // The first plan has to finish before there's one to keep.
    const isBuilding = !live || live.phase === "build"

    return (
        <Flex flexDir="column" gap="2">
            <Flex alignItems="center" gap="2">
                <Flex flex="1">
                    <StatusText tone="muted">
                        {planSearchHeadline(live, isStopping)}
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
                    onClick={onStop}
                >
                    Stop & keep
                </Button>

                <Button variant="secondary" size="sm" onClick={onCancel}>
                    Cancel
                </Button>
            </Flex>

            <ProgressBar
                label="Time without a better plan"
                value={
                    live && !isBuilding ? (live.idleMs / live.stallMs) * 100 : 0
                }
            />

            {live && (
                <StatusText tone="muted">
                    {planPhaseStatus({ finds: live.finds, phase: live.phase })}
                </StatusText>
            )}

            {live && !isBuilding && (
                <StatusText tone="muted">
                    {idleStatus(live.idleMs, live.stallMs, "plan")}
                </StatusText>
            )}

            {live?.finds.firstFoundMs != null && (
                <StatusText tone="muted">
                    {improvementStatus({ finds: live.finds, noun: "plan" })}
                </StatusText>
            )}
        </Flex>
    )
}
