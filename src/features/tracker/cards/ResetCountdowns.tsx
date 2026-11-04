import { Flex } from "@chakra-ui/react"
import { TRACKER_RESETS } from "@tracker/config/trackerResets"
import { ResetCountdown } from "./ResetCountdown"

type ResetCountdownsProps = {
    now: number
}

export const ResetCountdowns = ({ now }: ResetCountdownsProps) => {
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
