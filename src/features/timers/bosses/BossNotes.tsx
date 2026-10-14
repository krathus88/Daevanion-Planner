import { Flex, Text } from "@chakra-ui/react"
import type { TimerState } from "@timers/logic/timerState"

type BossNotesProps = {
    name: string
    state: TimerState
}

// Warns when the spawn time is a guess rather than the in-game timer.
export const BossNotes = ({ name, state }: BossNotesProps) => {
    if (state.status !== "open" && state.status !== "upcoming") {
        return null
    }

    if (!state.estimated && !state.afterMaintenance) {
        return null
    }

    return (
        <Flex
            px="3"
            py="2"
            flexDir="column"
            gap="1"
            layerStyle="notice"
            fontSize="xs"
            lineHeight="tall"
            role="status"
        >
            {state.estimated && (
                <Text>
                    Estimated: this assumes {name} died about a minute after it
                    spawned. Enter the in-game timer again for an exact time.
                </Text>
            )}

            {state.afterMaintenance && (
                <Text>
                    A weekly maintenance happened since the timer was entered,
                    so this may be off.
                </Text>
            )}
        </Flex>
    )
}
