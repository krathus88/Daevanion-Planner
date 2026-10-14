import { Flex, Text } from "@chakra-ui/react"
import { formatCountdown, formatLocalTime } from "@timers/logic/formatTime"
import type { TimerState } from "@timers/logic/timerState"

type TimerStatusProps = {
    state: TimerState
    now: number
}

// The countdown, and when it ends in the viewer's own time.
export const TimerStatus = ({ state, now }: TimerStatusProps) => {
    // Events and resets always have one of these; bosses use BossStatus.
    if (state.status !== "open" && state.status !== "upcoming") {
        return null
    }

    const isOpen = state.status === "open"
    const isUncertain = state.estimated || state.afterMaintenance

    return (
        <Flex flexDir="column" gap="0.5">
            <Text
                textStyle="stat"
                color={isOpen ? "app.success" : "app.fg"}
                fontVariantNumeric="tabular-nums"
            >
                {isUncertain && "~"}
                {formatCountdown(state.at - now)}
            </Text>

            <Text textStyle="caption">
                {isOpen
                    ? `Open now, until ${formatLocalTime(state.at)}`
                    : `Next at ${formatLocalTime(state.at)}`}
            </Text>
        </Flex>
    )
}
