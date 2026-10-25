import {
    Flex,
    Image,
    Text,
    useRecipe,
    type SystemStyleObject,
} from "@chakra-ui/react"
import type { TimerColor, TimerId } from "@timers/config/timers"
import type { TimerEntry } from "@timers/hooks/useTimers"
import { ComingNextButton } from "./ComingNextButton"
import { PinButton } from "./PinButton"
import { TimerCustomise } from "./TimerCustomise"
import { TimerStatus } from "./TimerStatus"

type TimerCardProps = {
    entry: TimerEntry
    now: number
    onTogglePinned: (id: TimerId) => void
    onColorChange: (id: TimerId, color: TimerColor) => void
    onColorReset: (id: TimerId) => void
    onSoonMinutesChange: (id: TimerId, minutes: number) => void
}

export const TimerCard = ({
    entry,
    now,
    onTogglePinned,
    onColorChange,
    onColorReset,
    onSoonMinutesChange,
}: TimerCardProps) => {
    const highlight = useRecipe({ key: "timerHighlight" })

    const highlightStyles: SystemStyleObject = highlight({
        state: entry.alert,
        tone: entry.color.tone,
    })

    return (
        <Flex
            colorPalette={entry.color.hue}
            p="4"
            flexDir="column"
            gap="3"
            borderRadius="lg"
            css={highlightStyles}
        >
            <Flex alignItems="center" gap="3">
                {entry.timer.icon && (
                    <Image
                        src={entry.timer.icon}
                        boxSize="10"
                        flexShrink="0"
                        objectFit="contain"
                        alt=""
                        aria-hidden="true"
                    />
                )}

                <Text flex="1" fontWeight="semibold">
                    {entry.timer.name}
                </Text>

                <ComingNextButton
                    id={entry.timer.id}
                    included={entry.inComingNext}
                    name={entry.timer.name}
                />

                <PinButton
                    id={entry.timer.id}
                    pinned={entry.pinned}
                    name={entry.timer.name}
                    onToggle={onTogglePinned}
                />
            </Flex>

            <TimerStatus state={entry.state} now={now} />

            <Text textStyle="hint">{entry.timer.description}</Text>

            <TimerCustomise
                id={entry.timer.id}
                color={entry.color}
                hasCustomColor={entry.hasCustomColor}
                soonMinutes={entry.soonMinutes}
                onColorChange={onColorChange}
                onColorReset={onColorReset}
                onSoonMinutesChange={onSoonMinutesChange}
            />
        </Flex>
    )
}
