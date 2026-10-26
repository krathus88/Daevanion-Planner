import { Flex, Text } from "@chakra-ui/react"
import { formatCountdown, formatLocalTime } from "@timers/logic/formatTime"
import type { TimerState } from "@timers/logic/timerState"
import { ChanceMarker } from "./ChanceMarker"

type TimerStatusProps = {
    state: TimerState
    now: number
    chance?: boolean
}

export const TimerStatus = ({ state, now, chance }: TimerStatusProps) => {
    if (state.status !== "open" && state.status !== "upcoming") {
        return null
    }

    const isOpen = state.status === "open"
    const isUncertain = state.estimated || state.afterMaintenance

    return (
        <Flex flexDir="column" gap="0.5">
            <Flex alignItems="center" gap="2">
                <Text
                    textStyle="stat"
                    color={isOpen ? "app.success" : "app.fg"}
                    fontVariantNumeric="tabular-nums"
                >
                    {isUncertain && "~"}
                    {formatCountdown(state.at - now)}
                </Text>

                {chance && <ChanceMarker showLabel />}
            </Flex>

            <Text textStyle="caption">
                {isOpen
                    ? `Open now, until ${formatLocalTime(state.at)}`
                    : `Next at ${formatLocalTime(state.at)}`}
            </Text>
        </Flex>
    )
}
