import { Flex, Text } from "@chakra-ui/react"
import { ARIEL_STAT_NAMES, type ArielStatType } from "@config/stats/stats"
import type { StatTier } from "@planner/config/stats"
import type { StatNodeCount } from "@planner/storage/statPriorities"
import { StatTierPicker } from "./StatTierPicker"

type ArielStatRowProps = {
    stat: ArielStatType
    tier: StatTier
    count?: StatNodeCount
    onTierChange: (stat: ArielStatType, tier: StatTier) => void
}

export const ArielStatRow = ({
    stat,
    tier,
    count,
    onTierChange,
}: ArielStatRowProps) => {
    const handleTierChange = (next: StatTier) => {
        onTierChange(stat, next)
    }

    const name = ARIEL_STAT_NAMES[stat]

    return (
        <Flex minW="0" alignItems="center" gap="2">
            <Text minW="0" flex="1" fontSize="sm" truncate>
                {name}
            </Text>

            {count && (
                <Text
                    flexShrink="0"
                    color={count.taken > 0 ? "app.success" : "app.subtle"}
                    fontSize="xs"
                    whiteSpace="nowrap"
                    title={`${count.taken} of ${count.total} ${name} nodes taken on Ariel`}
                >
                    {count.taken} / {count.total}
                </Text>
            )}

            <StatTierPicker
                value={tier}
                label={`Ariel ${name} priority`}
                onChange={handleTierChange}
            />
        </Flex>
    )
}
