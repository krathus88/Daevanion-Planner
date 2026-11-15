import { Flex, Text } from "@chakra-ui/react"
import type { TimerState } from "@timers/logic/timerState"

type BossNotesProps = {
    state: TimerState
}

export const BossNotes = ({ state }: BossNotesProps) => {
    if (
        state.status !== "open" &&
        state.status !== "upcoming" &&
        state.status !== "up"
    ) {
        return null
    }

    if (!state.afterMaintenance) {
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
            <Text>Maintenance since this was entered; it may be off.</Text>
        </Flex>
    )
}
