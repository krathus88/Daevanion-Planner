import { Flex, Text } from "@chakra-ui/react"
import type { TimerState } from "@timers/logic/timerState"

type BossNotesProps = {
    name: string
    aliveFor: number
    state: TimerState
}

export const BossNotes = ({ name, aliveFor, state }: BossNotesProps) => {
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
                    Estimated, assuming {name} died{" "}
                    {aliveFor < 60_000
                        ? `${aliveFor / 1000} seconds`
                        : "a minute"}{" "}
                    after spawning. Re-enter the in-game timer to fix it.
                </Text>
            )}

            {state.afterMaintenance && (
                <Text>Maintenance since this was entered; it may be off.</Text>
            )}
        </Flex>
    )
}
