import { Flex, Text } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { useSharedAllocation } from "@planner/hooks/useSharedAllocation"
import { PointsField } from "@common/PointsField"
import { StatusText } from "@common/StatusText"
import { Term } from "@common/Term"
import { ArielSection } from "./ArielSection"
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
                One budget shared by the four main boards.
            </Text>

            <PointsField
                label="Total points"
                value={allocation.totalPoints}
                onChange={allocation.setTotalPoints}
            />

            <PrioritySection
                classPreset={classPreset}
                hint={
                    <>
                        <Term>Optimize all boards</Term> builds each
                        board&apos;s route from these.
                    </>
                }
            />

            <ArielSection classId={classPreset.id} />

            <PriorityOptimizer
                classPreset={classPreset}
                totalPoints={allocation.totalPoints}
                onComplete={onOptimizeAllComplete}
            />

            <CompareRoutes
                classId={classPreset.id}
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
