import { Flex } from "@chakra-ui/react"
import { useNow } from "@timers/hooks/useNow"
import { TRACKER_RESETS } from "@tracker/config/trackerResets"
import { ResetCountdown } from "./ResetCountdown"

// Reads the clock itself, so only the countdowns re-render each second.
export const ResetCountdowns = () => {
    const now = useNow()

    return (
        <Flex flexWrap="wrap" gap="3">
            {TRACKER_RESETS.map((reset) => (
                <ResetCountdown
                    key={reset.id}
                    reset={reset.id}
                    label={reset.label}
                    icon={reset.icon}
                    now={now}
                />
            ))}
        </Flex>
    )
}
