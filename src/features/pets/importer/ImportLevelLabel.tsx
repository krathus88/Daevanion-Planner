import { Flex, Text } from "@chakra-ui/react"
import { LevelBadge } from "@pets/LevelBadge"
import { SoulProgress } from "@pets/SoulProgress"

type ImportLevelLabelProps = {
    // Pet Insight level; 0 is locked.
    level: number
    // Total souls.
    souls?: number
}

export const ImportLevelLabel = ({ level, souls }: ImportLevelLabelProps) => {
    return (
        <Flex alignItems="center" gap="1">
            {level > 0 ? (
                <LevelBadge level={level} />
            ) : (
                <Text
                    as="span"
                    color="app.subtle"
                    fontSize="xs"
                    fontWeight="semibold"
                >
                    Locked
                </Text>
            )}

            {souls !== undefined && <SoulProgress souls={souls} />}
        </Flex>
    )
}
