import { Text } from "@chakra-ui/react"
import { LEVEL_COLORS } from "@pets/logic/petLevels"

type LevelBadgeProps = {
    // 1-3; each level has its own color.
    level: number
}

export const LevelBadge = ({ level }: LevelBadgeProps) => {
    const colors = LEVEL_COLORS[level]

    return (
        <Text
            as="span"
            px="1.5"
            flexShrink="0"
            bg={colors.bg}
            borderRadius="sm"
            color={colors.fg}
            fontSize="xs"
            fontWeight="semibold"
            whiteSpace="nowrap"
        >
            Lv{level}
        </Text>
    )
}
