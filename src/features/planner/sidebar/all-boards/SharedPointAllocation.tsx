import { Flex, Text } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { useSharedAllocation } from "@planner/hooks/useSharedAllocation"
import { PointsField } from "@common/PointsField"
import { Section } from "@common/Section"
import { StatusText } from "@common/StatusText"
import { CompareRoutes } from "./CompareRoutes"
import { OptimizeAllBoards } from "./OptimizeAllBoards"
import { AbilityPriorityList } from "./priorities/AbilityPriorityList"
import { StatPriorityList } from "./priorities/StatPriorityList"

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
                Split one shared point budget across all four boards. Optimize
                all boards uses the priorities below to build a route on each
                one.
            </Text>

            <PointsField
                label="Total points"
                value={allocation.totalPoints}
                onChange={allocation.setTotalPoints}
            />

            <Section title="Ability priorities">
                <AbilityPriorityList classPreset={classPreset} />
            </Section>

            <Section title="Stat priorities">
                <StatPriorityList classPreset={classPreset} />
            </Section>

            <OptimizeAllBoards
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
