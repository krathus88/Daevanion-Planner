import { Flex, Text } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { useSharedAllocation } from "@planner/hooks/useSharedAllocation"
import { PointsField } from "@common/PointsField"
import { StatusText } from "@common/StatusText"
import { CompareRoutes } from "./CompareRoutes"
import { PriorityOptimizer } from "../priorities/PriorityOptimizer"
import { PrioritySection } from "../priorities/PrioritySection"

type SharedPointAllocationProps = {
    isCompareOpen: boolean
    onCompareOpenChange: (open: boolean) => void
    onOptimizeAllComplete: (applyResults: () => void) => void
}

export const SharedPointAllocation = ({
    isCompareOpen,
    onCompareOpenChange,
    onOptimizeAllComplete,
}: SharedPointAllocationProps) => {
    const { classPreset } = useBoard()
    const allocation = useSharedAllocation(classPreset.id)

    return (
        <Flex w="full" flexDir="column" gap="4">
            <Text textStyle="hint">
                Split one shared point budget across all four boards.
            </Text>

            <PointsField
                label="Total points"
                value={allocation.totalPoints}
                onChange={allocation.setTotalPoints}
            />

            <PrioritySection
                classPreset={classPreset}
                hint="Optimize all boards uses these priorities to build a route on each board."
            />

            <PriorityOptimizer
                classPreset={classPreset}
                totalPoints={allocation.totalPoints}
                onComplete={onOptimizeAllComplete}
            />

            <CompareRoutes
                allocation={allocation}
                open={isCompareOpen}
                onOpenChange={onCompareOpenChange}
            />

            {allocation.snapshot.error && (
                <StatusText>{allocation.snapshot.error}</StatusText>
            )}
        </Flex>
    )
}
