import { Collapsible, Flex, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import type { TimerEntry } from "@timers/hooks/useTimers"
import type { PinnedColumns } from "@timers/logic/pinnedColumns"
import { lazy, Suspense } from "react"
import { LayoutLoading } from "./LayoutLoading"
import type { TabEdge } from "./useTabEdge"

const PinnedLayoutBoard = lazy(async () => {
    const module = await import("./PinnedLayoutBoard")

    return { default: module.PinnedLayoutBoard }
})

export const PINNED_LAYOUT_ID = "pinned-layout"

type PinnedLayoutProps = {
    columns: TimerEntry[][]
    now: number
    open: boolean
    tabEdge: TabEdge
    onChange: (columns: PinnedColumns) => void
}

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
                <Card
                    borderTopLeftRadius={
                        tabEdge === "left" ? "none" : undefined
                    }
                    borderTopRightRadius={
                        tabEdge === "right" ? "none" : undefined
                    }
                >
                    <Text textStyle="hint">
                        As shown in the header. Drag onto a timer to swap, under
                        one to stack, or between columns for its own column.
                    </Text>

                    {columns.length === 0 ? (
                        <Text textStyle="caption">
                            Nothing pinned yet. Use the pin on a timer below.
                        </Text>
                    ) : (
                        <Flex
                            px="2"
                            bg="app.header"
                            borderColor="app.border"
                            borderRadius="md"
                            borderWidth="1px"
                        >
                            <Suspense
                                fallback={
                                    <LayoutLoading
                                        columns={columns}
                                        now={now}
                                    />
                                }
                            >
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
