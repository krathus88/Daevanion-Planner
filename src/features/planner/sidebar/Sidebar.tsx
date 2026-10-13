import { Box, Flex, Tabs, type TabsValueChangeDetails } from "@chakra-ui/react"
import { useBoard } from "@planner/context/boardContext"
import { useAllBoardsResults } from "@planner/hooks/useAllBoardsResults"
import type { SidebarTab } from "../types"
import { SharedPointAllocation } from "./all-boards/SharedPointAllocation"
import { PlanTab } from "./plan/PlanTab"
import { PrioritiesTab } from "./priorities/PrioritiesTab"
import { SavedPanel } from "./saved/SavedPanel"
import { SidebarMessage } from "./SidebarMessage"
import { SidebarTabList } from "./SidebarTabList"

export const Sidebar = () => {
    const { sidebarTab, changeSidebarTab, message, manual, planner } =
        useBoard()
    const allBoards = useAllBoardsResults(sidebarTab, changeSidebarTab)

    const handleTabChange = (details: TabsValueChangeDetails) => {
        allBoards.changeTab(details.value as SidebarTab)
    }

    const savedCount = planner.savedPlanners.length + manual.savedBoards.length

    return (
        <Flex
            as="aside"
            pos={{ xl: "sticky" }}
            top={{ xl: "headerOffset" }}
            w={{ base: "full", xl: "sidebar" }}
            minW="0"
            maxH={{ xl: "sidebarMaxH" }}
            flexShrink="0"
            flexDir="column"
            overflow="hidden"
            bg="app.panel"
            borderWidth="1px"
            borderColor="app.border"
            borderRadius="xl"
            boxShadow="lg"
        >
            <Tabs.Root
                variant="line"
                value={sidebarTab}
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

                    <Tabs.Content value="priorities" p="4">
                        <PrioritiesTab />
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

            {message && <SidebarMessage>{message}</SidebarMessage>}
        </Flex>
    )
}
