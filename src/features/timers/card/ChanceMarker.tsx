import { Flex, Icon, Text } from "@chakra-ui/react"
import { LuDices } from "react-icons/lu"

type ChanceMarkerProps = {
    showLabel?: boolean
}

// Marks timers that only have a chance to happen when they come up.
export const ChanceMarker = ({ showLabel }: ChanceMarkerProps) => {
    const label = "Random chance: it may not happen at this time"

    return (
        <Flex
            flexShrink="0"
            alignItems="center"
            gap="1"
            color="app.muted"
            role="img"
            title={label}
            aria-label={label}
        >
            <Icon boxSize="3.5">
                <LuDices />
            </Icon>

            {showLabel && (
                <Text textStyle="caption" aria-hidden="true">
                    Chance
                </Text>
            )}
        </Flex>
    )
}
