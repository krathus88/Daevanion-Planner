import { Flex, Text } from "@chakra-ui/react"
import { STAT_NAMES, type StatTier, type StatType } from "@planner/config/stats"
import type { StatSettings } from "@planner/storage/statPriorities"
import { StatTierPicker } from "./StatTierPicker"

type StatPriorityRowProps = {
    stat: StatType
    settings: StatSettings
    onSettingsChange: (settings: StatSettings) => void
}

export const StatPriorityRow = ({
    stat,
    settings,
    onSettingsChange,
}: StatPriorityRowProps) => {
    const handleTierChange = (tier: StatTier) => {
        onSettingsChange({
            ...settings,
            tiers: { ...settings.tiers, [stat]: tier },
        })
    }

    return (
        <Flex minW="0" alignItems="center" gap="2">
            <Text minW="0" flex="1" fontSize="sm" truncate>
                {STAT_NAMES[stat]}
            </Text>

            <StatTierPicker
                value={settings.tiers[stat]}
                label={`${STAT_NAMES[stat]} priority`}
                onChange={handleTierChange}
            />
        </Flex>
    )
}
