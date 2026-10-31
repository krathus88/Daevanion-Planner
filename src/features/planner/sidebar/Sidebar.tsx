import { Box, Tabs, type TabsValueChangeDetails } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { getBoardGaps } from "@planner/game-check/screenshotResults"
import { useAllBoardsResults } from "@planner/hooks/useAllBoardsResults"
import { SharedSettingsPanel } from "@planner/share/SharedSettingsPanel"
import { useSharedSettings } from "@planner/share/sharedSettingsContext"
import type { SidebarTab } from "../types"
import { BoardSwitcher } from "./BoardSwitcher"
import { SharedPointAllocation } from "./all-boards/SharedPointAllocation"
import { PlanTab } from "./plan/PlanTab"
import { SavedPanel } from "./saved/SavedPanel"
import { SidebarFrame } from "./SidebarFrame"
import { SidebarMessage } from "./SidebarMessage"
import { SidebarTabList } from "./SidebarTabList"

export const Sidebar = () => {
    const board = useBoard()
    const {
        sidebarTab,
        changeSidebarTab,
        message,
        manual,
        planner,
        layoutName,
    } = board
    const sharedSettings = useSharedSettings()
    const allBoards = useAllBoardsResults(sidebarTab, changeSidebarTab)

    const handleTabChange = (details: TabsValueChangeDetails) => {
        allBoards.changeTab(details.value as SidebarTab)
    }

    const savedCount = planner.savedPlanners.length + manual.savedBoards.length
    const gameWarnings = board.gameCheck.unseen.filter((boardId) => {
        const gaps = getBoardGaps(board, boardId)

        return gaps && (gaps.missing.length > 0 || gaps.extra.length > 0)
    })

    return (
        <SidebarFrame>
            <BoardSwitcher
                mx="3"
                mt="3"
                flexShrink="0"
                warnings={gameWarnings}
            />

            {sharedSettings ? (
                <SharedSettingsPanel
                    layout={layoutName}
                    plan={sharedSettings}
                />
            ) : (
                <Tabs.Root
                    variant="line"
                    fitted
                    value={sidebarTab}
                    lazyMount
                    minH="0"
                    display="flex"
                    flexDir="column"
                    onValueChange={handleTabChange}
                >
                    <SidebarTabList
                        hasUnseenResults={allBoards.hasUnseenResults}
                        savedCount={savedCount}
                    />

                    <Box minH="0" flex="1" overflowY="auto">
                        <Tabs.Content value="plan" p="4">
                            <PlanTab />
                        </Tabs.Content>

                        <Tabs.Content value="saved" p="4">
                            <SavedPanel />
                        </Tabs.Content>

                        <Tabs.Content value="all-boards" p="4">
                            <SharedPointAllocation
                                isCompareOpen={allBoards.isCompareOpen}
                                onCompareOpenChange={allBoards.setIsCompareOpen}
                                onOptimizeAllComplete={
                                    allBoards.handleOptimizeAllComplete
                                }
                            />
                        </Tabs.Content>
                    </Box>
                </Tabs.Root>
            )}

            {message && <SidebarMessage>{message}</SidebarMessage>}
        </SidebarFrame>
    )
}
