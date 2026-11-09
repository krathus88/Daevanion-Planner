import { Flex, Text } from "@chakra-ui/react"
import { ARIEL_STAT_NAMES, type ArielPriorityStat } from "@config/stats/stats"
import type { StatTier } from "@planner/config/stats"
import { useStatHighlight } from "@planner/hooks/useStatHighlight"
import type { StatNodeCount } from "@planner/storage/statPriorities"
import { AbilitySkipName } from "./AbilitySkipName"
import { StatTierPicker } from "./StatTierPicker"

type ArielStatRowProps = {
    stat: ArielPriorityStat
    tier: StatTier
    ignored: boolean
    count?: StatNodeCount
    onTierChange: (stat: ArielPriorityStat, tier: StatTier) => void
    onIgnoredChange: (stat: ArielPriorityStat, ignored: boolean) => void
}

export const ArielStatRow = ({
    stat,
    tier,
    ignored,
    count,
    onTierChange,
    onIgnoredChange,
}: ArielStatRowProps) => {
    const highlight = useStatHighlight(stat)

    const handleTierChange = (next: StatTier) => {
        onTierChange(stat, next)
    }

    const handleIgnoredChange = (next: boolean) => {
        onIgnoredChange(stat, next)
    }

    // Hovering the name shows its nodes on the board.
    const handleHoverChange = (hovered: boolean) => {
        if (hovered) {
            highlight.show()
        } else {
            highlight.hide()
        }
    }

    const name = ARIEL_STAT_NAMES[stat]

    return (
        <Flex minW="0" alignItems="center" gap="2">
            <AbilitySkipName
                name={name}
                skipped={ignored}
                verb="ignore"
                onChange={handleIgnoredChange}
                onHoverChange={handleHoverChange}
            />

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

            {/* Ignored shows no tier; the kept one comes back with it. */}
            <StatTierPicker
                value={ignored ? null : tier}
                disabled={ignored}
                label={`Ariel ${name} priority`}
                onChange={handleTierChange}
            />
        </Flex>
    )
}
