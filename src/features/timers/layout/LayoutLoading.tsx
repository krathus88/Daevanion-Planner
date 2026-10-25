import { Flex, Spinner, VisuallyHidden } from "@chakra-ui/react"
import type { TimerEntry } from "@timers/hooks/useTimers"
import { TimerChip } from "@timers/pinned/TimerChip"

type LayoutLoadingProps = {
    columns: TimerEntry[][]
    now: number
}

// Hidden chips hold the board's size so nothing shifts when it loads.
export const LayoutLoading = ({ columns, now }: LayoutLoadingProps) => {
    return (
        <Flex
            position="relative"
            py="2"
            minW="0"
            flex="1"
            flexDir="row-reverse"
            gap="2"
            overflow="hidden"
        >
            {columns.map((column) => (
                <Flex
                    key={column[0].timer.id}
                    flexShrink="0"
                    flexDir="column"
                    justifyContent="center"
                    gap="0.5"
                    visibility="hidden"
                    aria-hidden="true"
                >
                    {column.map((entry) => (
                        <TimerChip
                            key={entry.timer.id}
                            entry={entry}
                            now={now}
                        />
                    ))}
                </Flex>
            ))}

            <Flex
                position="absolute"
                inset="0"
                alignItems="center"
                justifyContent="center"
            >
                <Spinner size="sm" color="app.muted" />

                <VisuallyHidden>Loading layout</VisuallyHidden>
            </Flex>
        </Flex>
    )
}
