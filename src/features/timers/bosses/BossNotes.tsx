import { Flex, Text } from "@chakra-ui/react"
import type { TimerState } from "@timers/logic/timerState"

type BossNotesProps = {
    name: string
    aliveFor: number
    state: TimerState
}

// "30 seconds", "a minute", "8 minutes 30 seconds".
const formatAliveFor = (aliveFor: number) => {
    const minutes = Math.floor(aliveFor / 60_000)
    const seconds = Math.round((aliveFor % 60_000) / 1000)
    const parts = []

    if (minutes > 0) {
        parts.push(minutes === 1 ? "a minute" : `${minutes} minutes`)
    }

    if (seconds > 0) {
        parts.push(`${seconds} seconds`)
    }

    return parts.join(" ")
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
                    Estimated, assuming {name} died {formatAliveFor(aliveFor)}{" "}
                    after spawning. Re-enter the in-game timer to fix it.
                </Text>
            )}

            {state.afterMaintenance && (
                <Text>Maintenance since this was entered; it may be off.</Text>
            )}
        </Flex>
    )
}
