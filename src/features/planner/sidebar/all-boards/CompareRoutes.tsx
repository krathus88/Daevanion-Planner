import { Flex, Text } from "@chakra-ui/react"
import { BOARD_IDS } from "@config/boards"
import type { SharedAllocationState } from "@planner/hooks/useSharedAllocation"
import { ProgressBar } from "@common/ProgressBar"
import { Section } from "@common/Section"
import { RouteSelectRow } from "./RouteSelectRow"

type CompareRoutesProps = {
    allocation: SharedAllocationState
    open: boolean
    onOpenChange: (open: boolean) => void
}

// Each board's current route, and how they fit the shared budget together.
export const CompareRoutes = ({
    allocation,
    open,
    onOpenChange,
}: CompareRoutesProps) => {
    const isOverBudget = allocation.remainingPoints < 0
    const budgetColor = isOverBudget ? "app.danger" : "app.muted"

    return (
        <Section
            aside={
                <Text color={budgetColor} fontSize="xs" fontWeight="normal">
                    {allocation.allocatedPoints} / {allocation.totalPoints}{" "}
                    allocated
                </Text>
            }
            open={open}
            title="Compare saved routes"
            onOpenChange={onOpenChange}
        >
            <Text textStyle="hint">
                Each board&apos;s current route, and how they fit the shared
                budget together. Picking a route loads it onto that board; None
                clears the board. Optimize all boards doesn&apos;t read these.
                It replaces every board&apos;s route.
            </Text>

            <Flex alignItems="baseline" justifyContent="space-between">
                <Text textStyle="label">Route per board</Text>

                <Text color={budgetColor} fontSize="xs">
                    {isOverBudget
                        ? `${Math.abs(allocation.remainingPoints)} over budget`
                        : `${allocation.remainingPoints} left`}
                </Text>
            </Flex>

            {BOARD_IDS.map((layout) => (
                <RouteSelectRow
                    key={layout}
                    layout={layout}
                    options={allocation.snapshot.planners[layout]}
                    value={allocation.snapshot.selected[layout]}
                    onChange={allocation.selectRoute}
                />
            ))}

            <Flex pt="1" flexDir="column" gap="1.5">
                <Flex
                    justifyContent="space-between"
                    fontSize="sm"
                    fontWeight="semibold"
                >
                    <Text>Allocated</Text>

                    <Text>
                        {allocation.allocatedPoints} / {allocation.totalPoints}
                    </Text>
                </Flex>

                <ProgressBar
                    label="Points allocated"
                    tone={isOverBudget ? "danger" : "accent"}
                    value={
                        allocation.totalPoints > 0
                            ? (allocation.allocatedPoints /
                                  allocation.totalPoints) *
                              100
                            : 0
                    }
                />
            </Flex>
        </Section>
    )
}
