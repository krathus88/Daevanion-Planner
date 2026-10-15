import { Flex, Text } from "@chakra-ui/react"
import { formatCountdown, formatLocalTime } from "@timers/logic/formatTime"
import type { TimerState } from "@timers/logic/timerState"

type BossStatusProps = {
    state: TimerState
    now: number
}

const getStatusText = (state: TimerState, now: number) => {
    switch (state.status) {
        case "unset":
            return { main: "Not set", sub: "No timer yet" }
        case "killed":
            return {
                main: `${formatCountdown(now - state.at)} ago`,
                sub: `Killed ${formatLocalTime(state.at)}`,
            }
        case "open":
            return {
                main: "Up now",
                sub: `Spawned ${formatLocalTime(state.startedAt)}`,
            }
        case "upcoming":
            return {
                main: `${state.estimated || state.afterMaintenance ? "~" : ""}${formatCountdown(state.at - now)}`,
                sub: `Spawns ${formatLocalTime(state.at)}`,
            }
    }
}

// A boss row's countdown, and when it ends in the viewer's own time.
export const BossStatus = ({ state, now }: BossStatusProps) => {
    const text = getStatusText(state, now)

    return (
        <Flex minW="24" flexDir="column" alignItems="flex-end">
            <Text
                color={
                    state.status === "open"
                        ? "app.success"
                        : state.status === "upcoming"
                          ? "app.fg"
                          : "app.muted"
                }
                fontSize="sm"
                fontWeight="semibold"
                fontVariantNumeric="tabular-nums"
                whiteSpace="nowrap"
            >
                {text.main}
            </Text>

            <Text textStyle="caption" whiteSpace="nowrap">
                {text.sub}
            </Text>
        </Flex>
    )
}
