import { Text } from "@chakra-ui/react"
import { LevelBadge } from "@pets/LevelBadge"

type ImportLevelLabelProps = {
    // Pet Insight level; 0 is locked.
    level: number
}

export const ImportLevelLabel = ({ level }: ImportLevelLabelProps) => {
    if (level > 0) {
        return <LevelBadge level={level} />
    }

    return (
        <Text as="span" color="app.subtle" fontSize="xs" fontWeight="semibold">
            Locked
        </Text>
    )
}
