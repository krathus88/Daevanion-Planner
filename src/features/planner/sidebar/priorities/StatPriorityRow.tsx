import { Flex, Text } from "@chakra-ui/react"
import type { BoardId } from "@config/boards"
import { STAT_NAMES, type StatType } from "@config/stats/stats"
import type { StatTier } from "@planner/config/stats"
import type {
    StatNodeCount,
    StatSettings,
} from "@planner/storage/statPriorities"
import { scopeLabel } from "./scopeLabel"
import { StatTierPicker } from "./StatTierPicker"

type StatPriorityRowProps = {
    stat: StatType
    settings: StatSettings
    count?: StatNodeCount
    layout?: BoardId
    onSettingsChange: (settings: StatSettings) => void
}

export const StatPriorityRow = ({
    stat,
    settings,
    count,
    layout,
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

            {count && (
                <Text
                    flexShrink="0"
                    color={count.taken > 0 ? "app.success" : "app.subtle"}
                    fontSize="xs"
                    whiteSpace="nowrap"
                    title={`${count.taken} of ${count.total} ${STAT_NAMES[stat]} nodes taken ${scopeLabel(layout)}`}
                >
                    {count.taken} / {count.total}
                </Text>
            )}

            <StatTierPicker
                value={settings.tiers[stat]}
                label={`${STAT_NAMES[stat]} priority`}
                onChange={handleTierChange}
            />
        </Flex>
    )
}
