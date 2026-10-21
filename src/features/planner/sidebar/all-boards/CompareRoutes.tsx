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

// Each board's current route, grouped by the budget it spends: the shared
// points of the four main boards, and Ariel's own.
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
                    {/* Ariel's colour names it, as in the board switcher. */}
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
                Each board&apos;s current route, and how they fit their points:
                the four main boards share one budget, Ariel has its own.
                Picking a route loads it onto that board; None clears the board.
                Optimize all boards doesn&apos;t read these. It replaces every
                board&apos;s route.
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
