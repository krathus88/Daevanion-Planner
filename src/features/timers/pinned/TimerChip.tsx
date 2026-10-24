import { Flex, Text, useRecipe, type SystemStyleObject } from "@chakra-ui/react"
import { IconImage } from "@common/IconImage"
import type { TimerEntry } from "@timers/hooks/useTimers"
import { formatCountdown } from "@timers/logic/formatTime"
import type { TimerState } from "@timers/logic/timerState"
import type { Ref } from "react"

type TimerChipProps = {
    ref?: Ref<HTMLDivElement>
    entry: TimerEntry
    now: number
    draggable?: boolean
    dropTarget?: boolean
}

const getChipText = (state: TimerState, now: number) => {
    if (state.status === "unset") {
        return "set timer"
    }

    if (state.status === "killed") {
        return `${formatCountdown(now - state.at)} ago`
    }

    const countdown = formatCountdown(state.at - now)

    if (state.status === "open") {
        return `open ${countdown}`
    }

    return state.estimated || state.afterMaintenance
        ? `~${countdown}`
        : countdown
}

export const TimerChip = ({
    ref,
    entry,
    now,
    draggable,
    dropTarget,
}: TimerChipProps) => {
    const highlight = useRecipe({ key: "timerHighlight" })

    const state = entry.state
    const isOpen = state.status === "open"
    const highlightStyles: SystemStyleObject = highlight({
        state: entry.alert,
        tone: entry.color.tone,
    })

    return (
        <Flex
            ref={ref}
            colorPalette={entry.color.hue}
            px="1.5"
            py="0.5"
            alignItems="center"
            gap="1"
            borderRadius="md"
            outlineColor="app.accent"
            outlineStyle="solid"
            outlineWidth={dropTarget ? "2px" : "0"}
            fontSize="xs"
            whiteSpace="nowrap"
            cursor={draggable ? "grab" : undefined}
            touchAction={draggable ? "none" : undefined}
            css={highlightStyles}
            title={draggable ? `Drag ${entry.timer.name}` : entry.timer.name}
        >
            <IconImage icon={entry.timer.icon} size="4" />

            <Text color="app.muted">{entry.timer.shortName}</Text>

            <Text
                ml="auto"
                flexShrink="0"
                color={isOpen ? "colorPalette.fg" : "app.fg"}
                fontWeight="semibold"
                fontVariantNumeric="tabular-nums"
            >
                {getChipText(state, now)}
            </Text>
        </Flex>
    )
}
