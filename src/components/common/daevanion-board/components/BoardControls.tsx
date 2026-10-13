import { useRef, useState } from "react"
import { Box, Flex, Tabs, Text } from "@chakra-ui/react"
import type {
    BoardView,
    BoardWorkspaceProps,
    SidebarTab,
} from "./BoardWorkspace"
import { BoardModePanel } from "./BoardModePanel"
import { AbilityPriorityList } from "./AbilityPriorityList"
import { SavedPanel } from "./SavedPanel"
import { SharedPointAllocation } from "./SharedPointAllocation"

const modes: { value: BoardView; label: string }[] = [
    { value: "planner", label: "Planner" },
    { value: "board", label: "Manual" },
]

export const BoardControls = (props: BoardWorkspaceProps) => {
    const { view, changeView, classPreset, message } = props
    const { sidebarTab: tab, changeSidebarTab } = props
    // Set when "Optimize all boards" finishes while another tab is open: the
    // All boards tab glows until visited. The results are only applied to the
    // boards then, so a finished run doesn't replace what you're looking at.
    const [hasUnseenResults, setHasUnseenResults] = useState(false)
    const pendingResults = useRef<(() => void) | null>(null)
    const [isCompareOpen, setIsCompareOpen] = useState(false)
    // The optimizer's completion callback is created when the run starts, so
    // it reads the live tab from a ref rather than a stale render value.
    const tabRef = useRef(tab)

    const changeTab = (nextTab: SidebarTab) => {
        if (nextTab === "all-boards") {
            const applyResults = pendingResults.current
            pendingResults.current = null
            applyResults?.()
            setIsCompareOpen(applyResults !== null)
            setHasUnseenResults(false)
        }
        tabRef.current = nextTab
        changeSidebarTab(nextTab)
    }

    const handleOptimizeAllComplete = (applyResults: () => void) => {
        if (tabRef.current === "all-boards") {
            applyResults()
            setIsCompareOpen(true)
            return
        }

        pendingResults.current = applyResults
        setHasUnseenResults(true)
    }
    const savedCount = props.savedPlanners.length + props.savedBoards.length

    return (
        <Flex
            as="aside"
            background="app.panel"
            borderColor="app.border"
            borderWidth="1px"
            direction="column"
            flexShrink="0"
            maxHeight={{ xl: "calc(100vh - 7rem)" }}
            minWidth="0"
            overflow="hidden"
            position={{ xl: "sticky" }}
            rounded="xl"
            shadow="lg"
            top={{ xl: "5.5rem" }}
            width={{ base: "100%", xl: "26rem" }}
        >
            <Tabs.Root
                display="flex"
                flexDirection="column"
                minHeight="0"
                onValueChange={(event) => changeTab(event.value as SidebarTab)}
                value={tab}
                variant="line"
            >
                <Tabs.List
                    borderColor="app.border"
                    flexShrink="0"
                    overflowX="auto"
                    overflowY="hidden"
                    px="2"
                >
                    {(
                        [
                            ["plan", "Plan"],
                            [
                                "saved",
                                savedCount > 0
                                    ? `Saved · ${savedCount}`
                                    : "Saved",
                            ],
                            ["priorities", "Priorities"],
                            ["all-boards", "All boards"],
                        ] as const
                    ).map(([value, label]) => {
                        const isGlowing =
                            value === "all-boards" && hasUnseenResults

                        return (
                            <Tabs.Trigger
                                aria-description={
                                    isGlowing
                                        ? "New optimization results"
                                        : undefined
                                }
                                color={isGlowing ? "app.accent" : "app.muted"}
                                gap="1.5"
                                textShadow={
                                    isGlowing
                                        ? "0 0 10px rgba(224, 173, 76, 0.75)"
                                        : undefined
                                }
                                fontSize="sm"
                                key={value}
                                px="3"
                                value={value}
                                whiteSpace="nowrap"
                                _hover={{ color: "app.fg" }}
                                _selected={{
                                    color: "app.fg",
                                    "--indicator-color": "colors.app.accent",
                                }}
                            >
                                {label}
                                {isGlowing && (
                                    <Box
                                        animation="pulse 1.4s ease-in-out infinite"
                                        aria-hidden="true"
                                        background="app.accent"
                                        borderRadius="full"
                                        boxShadow="0 0 8px 2px rgba(224, 173, 76, 0.7)"
                                        boxSize="1.5"
                                    />
                                )}
                            </Tabs.Trigger>
                        )
                    })}
                </Tabs.List>

                <Box flex="1" minHeight="0" overflowY="auto">
                    <Tabs.Content p="4" pt="4" value="plan">
                        <Flex direction="column" gap="4">
                            <Flex
                                aria-label="Board mode"
                                background="app.inset"
                                borderColor="app.border"
                                borderWidth="1px"
                                gap="1"
                                p="1"
                                role="group"
                                rounded="lg"
                            >
                                {modes.map((mode) => {
                                    const isActive = view === mode.value

                                    return (
                                        <Box
                                            aria-pressed={isActive}
                                            as="button"
                                            background={
                                                isActive
                                                    ? "app.raised"
                                                    : "transparent"
                                            }
                                            boxShadow={
                                                isActive
                                                    ? "inset 0 0 0 1px var(--chakra-colors-app-border-strong)"
                                                    : "none"
                                            }
                                            color={
                                                isActive
                                                    ? "app.fg"
                                                    : "app.muted"
                                            }
                                            cursor="pointer"
                                            flex="1"
                                            fontSize="sm"
                                            fontWeight={
                                                isActive ? "semibold" : "medium"
                                            }
                                            key={mode.value}
                                            onClick={() =>
                                                changeView(mode.value)
                                            }
                                            py="1.5"
                                            rounded="md"
                                            _hover={{ color: "app.fg" }}
                                        >
                                            {mode.label}
                                        </Box>
                                    )
                                })}
                            </Flex>

                            <BoardModePanel {...props} />
                        </Flex>
                    </Tabs.Content>

                    <Tabs.Content p="4" value="saved">
                        <SavedPanel {...props} />
                    </Tabs.Content>

                    <Tabs.Content p="4" value="priorities">
                        <AbilityPriorityList classPreset={classPreset} />
                    </Tabs.Content>

                    <Tabs.Content p="4" value="all-boards">
                        <SharedPointAllocation
                            classPreset={classPreset}
                            isCompareOpen={isCompareOpen}
                            onCompareOpenChange={setIsCompareOpen}
                            onOptimizeAllComplete={handleOptimizeAllComplete}
                        />
                    </Tabs.Content>
                </Box>
            </Tabs.Root>

            {message && (
                <Text
                    background="app.raised"
                    borderColor="app.border"
                    borderTopWidth="1px"
                    color="app.accent"
                    flexShrink="0"
                    fontSize="sm"
                    px="4"
                    py="2.5"
                    role="status"
                >
                    {message}
                </Text>
            )}
        </Flex>
    )
}
