import { Text } from "@chakra-ui/react"
import { ARIEL_BOARD_ID, MAIN_BOARD_IDS } from "@config/boards"
import { useArielSettings } from "@planner/hooks/useArielSettings"
import type { SharedAllocationState } from "@planner/hooks/useSharedAllocation"
import { Section } from "@common/Section"
import { BudgetGroup } from "./BudgetGroup"
import { RouteSelectRow } from "./RouteSelectRow"

type CompareRoutesProps = {
    classId: string
    allocation: SharedAllocationState
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const CompareRoutes = ({
    classId,
    allocation,
    open,
    onOpenChange,
}: CompareRoutesProps) => {
    const { settings } = useArielSettings(classId)

    const arielAllocated = allocation.snapshot.routeCosts.ariel
    const isSharedOver = allocation.remainingPoints < 0
    const isArielOver = arielAllocated > settings.points

    return (
        <Section
            aside={
                <Text color="app.muted" fontSize="xs" fontWeight="normal">
                    <Text
                        as="span"
                        color={isSharedOver ? "app.danger" : undefined}
                    >
                        {allocation.allocatedPoints} / {allocation.totalPoints}
                    </Text>
                    {" · "}
                    <Text
                        as="span"
                        color={isArielOver ? "app.danger" : "board.arielActive"}
                        title="Ariel points allocated"
                    >
                        {arielAllocated} / {settings.points}
                    </Text>
                </Text>
            }
            open={open}
            title="Compare saved routes"
            onOpenChange={onOpenChange}
        >
            <Text textStyle="hint">
                Pick a route to load it onto that board. Optimize all boards
                replaces these.
            </Text>

            <BudgetGroup
                title="Shared points"
                allocated={allocation.allocatedPoints}
                total={allocation.totalPoints}
            >
                {MAIN_BOARD_IDS.map((layout) => (
                    <RouteSelectRow
                        key={layout}
                        layout={layout}
                        options={allocation.snapshot.planners[layout]}
                        value={allocation.snapshot.selected[layout]}
                        onChange={allocation.selectRoute}
                    />
                ))}
            </BudgetGroup>

            <BudgetGroup
                title="Ariel points"
                allocated={arielAllocated}
                total={settings.points}
            >
                <RouteSelectRow
                    layout={ARIEL_BOARD_ID}
                    options={allocation.snapshot.planners.ariel}
                    value={allocation.snapshot.selected.ariel}
                    onChange={allocation.selectRoute}
                />
            </BudgetGroup>
        </Section>
    )
}
