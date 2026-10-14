import { Collapsible, Flex, Text } from "@chakra-ui/react"
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react"
import { Card } from "@common/Card"
import { isTimerId } from "@timers/config/timers"
import type { TimerEntry } from "@timers/hooks/useTimers"
import {
    applyDrop,
    type LayoutDrop,
    type PinnedColumns,
} from "@timers/logic/pinnedColumns"
import { LayoutBoard } from "./LayoutBoard"
import type { TabEdge } from "./useTabEdge"

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
    const handleDragEnd = (event: DragEndEvent) => {
        const id = event.operation.source?.id
        const drop = event.operation.target?.data as LayoutDrop | undefined

        if (event.canceled || !isTimerId(id) || !drop) {
            return
        }

        onChange(applyDrop(ids, id, drop))
    }

    const ids = columns.map((column) => column.map((entry) => entry.timer.id))

    return (
        <Collapsible.Root open={open} ids={{ content: PINNED_LAYOUT_ID }}>
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
                            <DragDropProvider onDragEnd={handleDragEnd}>
                                <LayoutBoard columns={columns} now={now} />
                            </DragDropProvider>
                        </Flex>
                    )}
                </Card>
            </Collapsible.Content>
        </Collapsible.Root>
    )
}
