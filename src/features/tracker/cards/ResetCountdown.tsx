import { Flex, Text } from "@chakra-ui/react"
import { IconImage } from "@common/IconImage"
import { formatCountdown, formatLocalTime } from "@timers/logic/formatTime"
import { getNextReset } from "@tracker/logic/resetPeriods"
import type { TimedReset } from "@tracker/types"

type ResetCountdownProps = {
    reset: TimedReset
    label: string
    icon: string
    now: number
}

export const ResetCountdown = ({
    reset,
    label,
    icon,
    now,
}: ResetCountdownProps) => {
    const next = getNextReset(reset, now)

    return (
        <Flex px="3" py="2" alignItems="center" gap="3" layerStyle="card">
            <IconImage icon={icon} />

            <Flex flexDir="column">
                <Text textStyle="caption">{label} reset</Text>

                <Text fontWeight="semibold">
                    in {formatCountdown(next - now)}
                    <Text as="span" ms="2" textStyle="caption">
                        {formatLocalTime(next)}
                    </Text>
                </Text>
            </Flex>
        </Flex>
    )
}
