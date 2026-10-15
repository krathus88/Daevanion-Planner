import { Flex, SegmentGroup, Text } from "@chakra-ui/react"
import { BOARD_IDS, BOARD_NAMES, type BoardId } from "@config/boards"
import { classPresets } from "@config/classPresets"
import { useState } from "react"
import { WorkspaceRow } from "@planner/BoardWorkspace"
import { BoardColumn } from "@planner/board/BoardColumn"
import { BoardGrid } from "@planner/board/BoardGrid"
import { BoardLegend } from "@planner/board/BoardLegend"
import { layouts } from "@planner/config/layouts"
import { resolveAbilitiesByPosition } from "@planner/logic/abilityAssignments"
import { BoardSwitcher } from "@planner/sidebar/BoardSwitcher"
import { SidebarFrame } from "@planner/sidebar/SidebarFrame"
import type { BoardView } from "@planner/types"
import type { SharedPlan } from "./shareCode"
import { SharedBoardSummary } from "./SharedBoardSummary"
import { SharedPlanSave } from "./SharedPlanSave"

const modes: { value: BoardView; label: string }[] = [
    { value: "planner", label: "Planner" },
    { value: "board", label: "Manual" },
]

const noSelect = () => {}

type SharedPlanWorkspaceProps = {
    plan: SharedPlan
    layout: BoardId
}

export const SharedPlanWorkspace = ({
    plan,
    layout,
}: SharedPlanWorkspaceProps) => {
    const [preferredView, setPreferredView] = useState<BoardView>("planner")

    const classPreset = classPresets[plan.classId]
    const board = plan.boards[layout]
    const boardLayout = layouts[layout]
    // Shows the other half when this board only has one.
    const view: BoardView =
        preferredView === "planner"
            ? board?.route
                ? "planner"
                : "board"
            : board?.selection
              ? "board"
              : "planner"
    const isRoute = view === "planner" && board?.route

    const handleViewChange = (details: SegmentGroup.ValueChangeDetails) => {
        setPreferredView(details.value as BoardView)
    }

    const sharedBoardNames = BOARD_IDS.filter((id) => plan.boards[id])
        .map((id) => BOARD_NAMES[id])
        .join(", ")

    return (
        <WorkspaceRow>
            <BoardColumn>
                <BoardGrid
                    abilitiesByPosition={resolveAbilitiesByPosition(
                        boardLayout,
                        layout,
                        classPreset,
                    )}
                    availablePoints={0}
                    layout={boardLayout}
                    mode="readonly"
                    selectedCells={
                        new Set(
                            isRoute
                                ? board.route?.plannedPath
                                : board?.selection?.selectedCells,
                        )
                    }
                    targetCells={
                        new Set(isRoute ? board.route?.targetCells : [])
                    }
                    onSelect={noSelect}
                />

                <BoardLegend layout={boardLayout} />
            </BoardColumn>

            <SidebarFrame>
                <BoardSwitcher mx="3" mt="3" flexShrink="0" />

                <Flex
                    minH="0"
                    flex="1"
                    p="4"
                    flexDir="column"
                    gap="4"
                    overflowY="auto"
                >
                    <Flex flexDir="column" gap="1">
                        <Text fontWeight="semibold">
                            Shared {classPreset.name} plan
                        </Text>

                        <Text textStyle="hint">
                            Read-only. Covers {sharedBoardNames}. Save it to
                            keep a copy in your own plans.
                        </Text>
                    </Flex>

                    {board?.route && board.selection && (
                        <SegmentGroup.Root
                            layout="fill"
                            value={view}
                            aria-label="Board mode"
                            onValueChange={handleViewChange}
                        >
                            <SegmentGroup.Indicator />

                            <SegmentGroup.Items items={modes} />
                        </SegmentGroup.Root>
                    )}

                    {board ? (
                        <SharedBoardSummary
                            board={board}
                            layout={layout}
                            view={view}
                        />
                    ) : (
                        <Text color="app.muted" fontSize="sm">
                            This link has no plan for {BOARD_NAMES[layout]}.
                        </Text>
                    )}

                    <SharedPlanSave layout={layout} plan={plan} />
                </Flex>
            </SidebarFrame>
        </WorkspaceRow>
    )
}
