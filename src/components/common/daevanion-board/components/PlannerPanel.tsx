import { useState } from "react"
import { Badge, Flex, Text } from "@chakra-ui/react"
import type { BoardWorkspaceProps } from "./BoardWorkspace"
import {
    Card,
    Hint,
    PointsField,
    PrimaryButton,
    SearchTimeSelect,
    SecondaryButton,
    ToneButton,
} from "./PanelKit"
import { DEFAULT_SEARCH_SECONDS } from "./searchTime"

type Props = Pick<
    BoardWorkspaceProps,
    | "targetCells"
    | "availablePoints"
    | "updateAvailablePoints"
    | "isOptimizing"
    | "optimizePlanner"
    | "plannedCost"
    | "cancelOptimization"
    | "clearPlanner"
    | "plannerUndo"
    | "restorePlanner"
    | "activePlanner"
    | "optimizationProgress"
    | "plannedPath"
    | "formatPlannerDuration"
>

const Stat = ({
    label,
    value,
    tone,
}: {
    label: string
    value: string
    tone?: "danger" | "success"
}) => (
    <Flex direction="column" flex="1" gap="0.5" minWidth="0">
        <Text color="app.subtle" fontSize="xs">
            {label}
        </Text>
        <Text
            color={tone ? `app.${tone}` : "app.fg"}
            fontSize="lg"
            fontWeight="semibold"
            lineHeight="short"
        >
            {value}
        </Text>
    </Flex>
)

export const PlannerPanel = (props: Props) => {
    const {
        targetCells,
        availablePoints,
        updateAvailablePoints,
        isOptimizing,
        optimizePlanner,
        plannedCost,
        cancelOptimization,
        clearPlanner,
        plannerUndo,
        restorePlanner,
        activePlanner,
        optimizationProgress,
        plannedPath,
        formatPlannerDuration,
    } = props

    const [searchSeconds, setSearchSeconds] = useState(DEFAULT_SEARCH_SECONDS)
    const isOverBudget = plannedCost !== null && plannedCost > availablePoints

    return (
        <Flex direction="column" gap="4">
            <Flex alignItems="center" gap="2" minWidth="0">
                <Text color="app.subtle" flexShrink="0" fontSize="xs">
                    Active route
                </Text>
                <Text
                    flex="1"
                    fontSize="sm"
                    fontWeight="medium"
                    minWidth="0"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                >
                    {activePlanner?.name ?? "Unsaved route"}
                </Text>
                {activePlanner && (
                    <Badge
                        background="app.accentMuted"
                        color="app.accent"
                        flexShrink="0"
                        size="sm"
                    >
                        {activePlanner.source === "saved" ? "Saved" : "History"}
                    </Badge>
                )}
            </Flex>

            <PointsField
                disabled={isOptimizing}
                id="planner-available-points"
                label="Available points"
                onChange={updateAvailablePoints}
                value={availablePoints}
            />

            <Card>
                <Flex gap="3">
                    <Stat
                        label="Required nodes"
                        value={String(targetCells.size)}
                    />
                    <Stat
                        label="Route cost"
                        tone={
                            plannedCost === null
                                ? undefined
                                : isOverBudget
                                  ? "danger"
                                  : "success"
                        }
                        value={
                            plannedCost === null
                                ? "—"
                                : `${plannedCost} / ${availablePoints}`
                        }
                    />
                </Flex>

                {isOptimizing ? (
                    <Flex direction="column" gap="2">
                        <Text color="app.muted" fontSize="sm" role="status">
                            {optimizationProgress == null
                                ? "Starting the route search…"
                                : `Trying variations — ${optimizationProgress.attempts.toLocaleString()} tried · ${formatPlannerDuration(optimizationProgress.elapsedMs)}`}
                        </Text>
                        <SecondaryButton onClick={cancelOptimization} size="sm">
                            Cancel
                        </SecondaryButton>
                    </Flex>
                ) : (
                    <Flex gap="2">
                        <PrimaryButton
                            disabled={targetCells.size === 0}
                            flex="1"
                            onClick={() =>
                                optimizePlanner(searchSeconds * 1000)
                            }
                            size="sm"
                        >
                            Find a good path
                        </PrimaryButton>
                        {plannedCost !== null && (
                            <SecondaryButton
                                onClick={() =>
                                    optimizePlanner(searchSeconds * 1000)
                                }
                                size="sm"
                            >
                                Improve
                            </SecondaryButton>
                        )}
                        <SearchTimeSelect
                            onChange={setSearchSeconds}
                            size="sm"
                            value={searchSeconds}
                        />
                    </Flex>
                )}

                {plannedCost !== null && (
                    <Text
                        color={isOverBudget ? "app.danger" : "app.success"}
                        fontSize="sm"
                    >
                        {plannedPath.size} nodes on route ·{" "}
                        {isOverBudget
                            ? `${plannedCost - availablePoints} points over budget`
                            : `${availablePoints - plannedCost} points left`}
                    </Text>
                )}
            </Card>

            <Flex gap="2" wrap="wrap">
                <ToneButton
                    disabled={targetCells.size === 0 || isOptimizing}
                    onClick={clearPlanner}
                    size="xs"
                    tone="danger"
                >
                    Clear planner
                </ToneButton>
                {plannerUndo && (
                    <ToneButton onClick={restorePlanner} size="xs" tone="info">
                        Restore previous
                    </ToneButton>
                )}
            </Flex>

            <Hint>
                Click the nodes you need on the board, then find a connected
                path from the start. Save routes from the Saved tab.
            </Hint>
        </Flex>
    )
}
