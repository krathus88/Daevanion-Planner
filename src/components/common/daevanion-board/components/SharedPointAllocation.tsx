import { useEffect, useState } from "react"
import { Box, Flex, NativeSelect, Text } from "@chakra-ui/react"
import {
    applyPlannerToBoard,
    DEFAULT_TOTAL_POINTS,
    notifyPlansReplaced,
    readBoardProgress,
    readPlannerHistory,
    readSavedPlanners,
    readSharedAllocation,
    subscribeToBoardStorage,
    writeSharedAllocation,
    type SavedPlanner,
    type SharedAllocation,
} from "../storage/boardStorage"
import { layouts, type BoardLayoutName } from "../config/layouts"
import type { ClassPreset } from "../../../../config/classPresets"
import { PriorityOptimizeAllBoards } from "./PriorityOptimizeAllBoards"
import { appInputStyles } from "./panelStyles"
import { Card, Hint, PointsField, SectionLabel } from "./PanelKit"

const optionStyle = { backgroundColor: "#1c2230", color: "#e9ebf1" }

type PlannerOption = {
    id: string
    label: string
    points: number
}

type AllocationSnapshot = {
    allocation: SharedAllocation
    planners: Record<BoardLayoutName, PlannerOption[]>
    // Each board's current route: which option it matches, and its cost.
    selected: Record<BoardLayoutName, string>
    routeCosts: Record<BoardLayoutName, number>
    error: string | null
}

const readSnapshot = (classId: string): AllocationSnapshot => {
    const storedAllocation = readSharedAllocation(classId)
    const planners = {} as Record<BoardLayoutName, PlannerOption[]>
    const selected = {} as Record<BoardLayoutName, string>
    const routeCosts = {} as Record<BoardLayoutName, number>
    const errors = [storedAllocation.error]

    for (const layout of Object.keys(layouts) as BoardLayoutName[]) {
        const progress = readBoardProgress(classId, layout)
        const saved = readSavedPlanners(classId, layout)
        const history = readPlannerHistory(classId, layout)
        errors.push(progress.error, saved.error, history.error)

        const options: PlannerOption[] = []
        const activePlanner = progress.value?.activePlanner
        const hasRoute =
            progress.value?.plannedCost !== null &&
            progress.value?.plannedCost !== undefined
        routeCosts[layout] = progress.value?.plannedCost ?? 0
        selected[layout] = activePlanner
            ? `${activePlanner.source}:${activePlanner.id}`
            : hasRoute
              ? "current"
              : ""
        // A saved or history route is listed under its own name instead.
        if (progress.value && hasRoute && !activePlanner) {
            options.push({
                id: "current",
                label: `Unsaved route · ${progress.value.plannedCost} pts`,
                points: progress.value.plannedCost ?? 0,
            })
        }

        const addSavedOptions = (
            entries: SavedPlanner[],
            prefix: "saved" | "history",
        ) => {
            for (const entry of entries) {
                if (entry.plannedCost === null) {
                    continue
                }
                options.push({
                    id: `${prefix}:${entry.id}`,
                    label: `${entry.name} · ${entry.plannedCost} pts`,
                    points: entry.plannedCost,
                })
            }
        }
        addSavedOptions(saved.value ?? [], "saved")
        addSavedOptions(history.value ?? [], "history")
        planners[layout] = options
    }

    return {
        allocation: storedAllocation.value ?? {
            totalPoints: DEFAULT_TOTAL_POINTS,
            selectedPlannerIds: {},
        },
        planners,
        selected,
        routeCosts,
        error: errors.filter(Boolean).join(" ") || null,
    }
}

type SharedPointAllocationProps = {
    classPreset: ClassPreset
    isCompareOpen: boolean
    onCompareOpenChange: (open: boolean) => void
    onOptimizeAllComplete: (applyResults: () => void) => void
}

export const SharedPointAllocation = ({
    classPreset,
    isCompareOpen,
    onCompareOpenChange,
    onOptimizeAllComplete,
}: SharedPointAllocationProps) => {
    const classId = classPreset.id
    const [snapshot, setSnapshot] = useState(() => readSnapshot(classId))

    useEffect(
        () => subscribeToBoardStorage(() => setSnapshot(readSnapshot(classId))),
        [classId],
    )

    const updateAllocation = (allocation: SharedAllocation) => {
        setSnapshot((current) => ({ ...current, allocation }))
        const error = writeSharedAllocation(classId, allocation)
        if (error) {
            setSnapshot((current) => ({ ...current, error }))
        }
    }

    // Picking a route loads it onto that board; None clears the board.
    const updateSelectedPlanner = (
        layout: BoardLayoutName,
        plannerId: string,
    ) => {
        const applyError = applyPlannerToBoard(classId, layout, plannerId)
        if (applyError) {
            setSnapshot((current) => ({ ...current, error: applyError }))
            return
        }
        notifyPlansReplaced([layout])
    }

    const allocatedPoints = (Object.keys(layouts) as BoardLayoutName[]).reduce(
        (total, layout) => total + snapshot.routeCosts[layout],
        0,
    )
    const remainingPoints = snapshot.allocation.totalPoints - allocatedPoints

    const allocatedShare =
        snapshot.allocation.totalPoints > 0
            ? Math.min(1, allocatedPoints / snapshot.allocation.totalPoints)
            : 0

    return (
        <Flex direction="column" gap="4" width="100%">
            <Hint>
                Split one shared point budget across all four boards. Optimize
                all boards uses your ability priorities and Min/Max limits to
                build a route on each one.
            </Hint>

            <PointsField
                id="shared-total-points"
                label="Total points"
                onChange={(totalPoints) =>
                    updateAllocation({ ...snapshot.allocation, totalPoints })
                }
                value={snapshot.allocation.totalPoints}
            />

            <PriorityOptimizeAllBoards
                classPreset={classPreset}
                onComplete={onOptimizeAllComplete}
                totalPoints={snapshot.allocation.totalPoints}
            />

            <Box
                asChild
                background="app.raised"
                borderColor="app.border"
                borderWidth="1px"
                rounded="lg"
            >
                <details
                    onToggle={(event) =>
                        onCompareOpenChange(event.currentTarget.open)
                    }
                    open={isCompareOpen}
                >
                    <Flex
                        as="summary"
                        alignItems="baseline"
                        cursor="pointer"
                        gap="2"
                        justifyContent="space-between"
                        px="4"
                        py="3"
                    >
                        <Text fontSize="sm" fontWeight="semibold">
                            Compare saved routes
                        </Text>
                        <Text
                            color={
                                remainingPoints < 0 ? "app.danger" : "app.muted"
                            }
                            fontSize="xs"
                        >
                            {allocatedPoints} /{" "}
                            {snapshot.allocation.totalPoints} allocated
                        </Text>
                    </Flex>
                    <Card background="transparent" borderWidth="0" pt="0">
                        <Hint>
                            Each board&apos;s current route, and how they fit
                            the shared budget together. Picking a route loads it
                            onto that board; None clears the board. Optimize all
                            boards doesn&apos;t read these. It replaces every
                            board&apos;s route.
                        </Hint>
                        <Flex
                            alignItems="baseline"
                            justifyContent="space-between"
                        >
                            <SectionLabel>Route per board</SectionLabel>
                            <Text
                                color={
                                    remainingPoints < 0
                                        ? "app.danger"
                                        : "app.muted"
                                }
                                fontSize="xs"
                            >
                                {remainingPoints < 0
                                    ? `${Math.abs(remainingPoints)} over budget`
                                    : `${remainingPoints} left`}
                            </Text>
                        </Flex>

                        {(Object.keys(layouts) as BoardLayoutName[]).map(
                            (layout) => (
                                <Flex alignItems="center" gap="3" key={layout}>
                                    <Text
                                        asChild
                                        color="app.muted"
                                        flexShrink="0"
                                        fontSize="sm"
                                        textTransform="capitalize"
                                        width="16"
                                    >
                                        <label htmlFor={`allocation-${layout}`}>
                                            {layout}
                                        </label>
                                    </Text>
                                    <NativeSelect.Root
                                        flex="1"
                                        minWidth="0"
                                        size="sm"
                                    >
                                        <NativeSelect.Field
                                            {...appInputStyles}
                                            id={`allocation-${layout}`}
                                            onChange={(event) =>
                                                updateSelectedPlanner(
                                                    layout,
                                                    event.target.value,
                                                )
                                            }
                                            value={snapshot.selected[layout]}
                                        >
                                            <option
                                                style={optionStyle}
                                                value=""
                                            >
                                                None
                                            </option>
                                            {snapshot.planners[layout].map(
                                                (planner) => (
                                                    <option
                                                        key={planner.id}
                                                        style={optionStyle}
                                                        value={planner.id}
                                                    >
                                                        {planner.label}
                                                    </option>
                                                ),
                                            )}
                                        </NativeSelect.Field>
                                    </NativeSelect.Root>
                                </Flex>
                            ),
                        )}

                        <Flex direction="column" gap="1.5" pt="1">
                            <Flex justifyContent="space-between">
                                <Text fontSize="sm" fontWeight="semibold">
                                    Allocated
                                </Text>
                                <Text fontSize="sm" fontWeight="semibold">
                                    {allocatedPoints} /{" "}
                                    {snapshot.allocation.totalPoints}
                                </Text>
                            </Flex>
                            <Box
                                background="app.inset"
                                height="1.5"
                                overflow="hidden"
                                rounded="full"
                            >
                                <Box
                                    background={
                                        remainingPoints < 0
                                            ? "app.danger"
                                            : "app.accent"
                                    }
                                    height="100%"
                                    width={`${allocatedShare * 100}%`}
                                />
                            </Box>
                        </Flex>
                    </Card>
                </details>
            </Box>

            {snapshot.error && (
                <Text color="app.danger" fontSize="sm" role="status">
                    {snapshot.error}
                </Text>
            )}
        </Flex>
    )
}
