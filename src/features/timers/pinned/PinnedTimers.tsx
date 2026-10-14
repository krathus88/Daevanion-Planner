import { Flex, type FlexProps } from "@chakra-ui/react"
import { useTimers } from "@timers/hooks/useTimers"
import { SetTimerChip } from "./SetTimerChip"
import { TimerChip } from "./TimerChip"

// The pinned timers in the header, laid out as the user arranged them:
// columns read from the right, each with one timer or two stacked.
export const PinnedTimers = ({ ...props }: FlexProps) => {
    const { now, pinnedColumns, settings } = useTimers()

    if (!settings.showPinned || pinnedColumns.length === 0) {
        return null
    }

    return (
        <Flex
            minW="0"
            flexDir="row-reverse"
            gap="1"
            // Phones scroll sideways rather than squeeze the timers.
            overflowX="auto"
            aria-label="Pinned timers"
            {...props}
        >
            {pinnedColumns.map((column) => (
                <Flex
                    key={column[0].timer.id}
                    flexShrink="0"
                    flexDir="column"
                    justifyContent="center"
                    gap="0.5"
                >
                    {column.map((entry) =>
                        entry.state.status === "unset" ? (
                            <SetTimerChip
                                key={entry.timer.id}
                                entry={entry}
                                now={now}
                            />
                        ) : (
                            <TimerChip
                                key={entry.timer.id}
                                entry={entry}
                                now={now}
                            />
                        ),
                    )}
                </Flex>
            ))}
        </Flex>
    )
}
