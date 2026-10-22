import { Collapsible, Flex, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import type { TimerEntry } from "@timers/hooks/useTimers"
import type { PinnedColumns } from "@timers/logic/pinnedColumns"
import { lazy, Suspense } from "react"
import type { TabEdge } from "./useTabEdge"

// Drag and drop is only needed here, so it loads when the panel first opens.
const PinnedLayoutBoard = lazy(async () => {
    const module = await import("./PinnedLayoutBoard")

    return { default: module.PinnedLayoutBoard }
})

export const PINNED_LAYOUT_ID = "pinned-layout"

type PinnedLayoutProps = {
    columns: TimerEntry[][]
    now: number
    open: boolean
    // Where PinnedLayoutToggle sits above the panel.
    tabEdge: TabEdge
    onChange: (columns: PinnedColumns) => void
}

// Arrange the pinned timers exactly as the header shows them. Opened by
// PinnedLayoutToggle, which sits beside the "show pinned" switch.
export const PinnedLayout = ({
    columns,
    now,
    open,
    tabEdge,
    onChange,
}: PinnedLayoutProps) => {
    return (
        <Collapsible.Root
            open={open}
            ids={{ content: PINNED_LAYOUT_ID }}
            lazyMount
        >
            <Collapsible.Content>
                {/* The toggle is this panel's tab: the corner under it is
                    square, unless it's somewhere in the middle. */}
                <Card
                    borderTopLeftRadius={
                        tabEdge === "left" ? "none" : undefined
                    }
                    borderTopRightRadius={
                        tabEdge === "right" ? "none" : undefined
                    }
                >
                    <Text textStyle="hint">
                        This is how your pinned timers sit in the header, read
                        from the right. Drag one onto another to swap them,
                        under a lone timer to stack them, or between two columns
                        to give it a column of its own.
                    </Text>

                    {columns.length === 0 ? (
                        <Text textStyle="caption">
                            Nothing pinned yet. Use the pin on a timer below.
                        </Text>
                    ) : (
                        // Drawn on the header's background, so it looks the
                        // way it will up there.
                        <Flex
                            px="2"
                            bg="app.header"
                            borderColor="app.border"
                            borderRadius="md"
                            borderWidth="1px"
                        >
                            <Suspense>
                                <PinnedLayoutBoard
                                    columns={columns}
                                    now={now}
                                    onChange={onChange}
                                />
                            </Suspense>
                        </Flex>
                    )}
                </Card>
            </Collapsible.Content>
        </Collapsible.Root>
    )
}
