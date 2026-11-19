import { Flex, Text } from "@chakra-ui/react"
import { BOARD_NAMES, type StatBoardId } from "@config/boards"
import { STAT_BOARD_STAT_NAMES, type StatBoardStat } from "@config/stats/stats"
import type { StatTier } from "@planner/config/stats"
import { useStatHighlight } from "@planner/hooks/useStatHighlight"
import type { StatNodeCount } from "@planner/storage/statPriorities"
import { AbilitySkipName } from "./AbilitySkipName"
import { StatTierPicker } from "./StatTierPicker"

type StatBoardStatRowProps = {
    board: StatBoardId
    stat: StatBoardStat
    tier: StatTier
    ignored: boolean
    count?: StatNodeCount
    onTierChange: (stat: StatBoardStat, tier: StatTier) => void
    onIgnoredChange: (stat: StatBoardStat, ignored: boolean) => void
}

export const StatBoardStatRow = ({
    board,
    stat,
    tier,
    ignored,
    count,
    onTierChange,
    onIgnoredChange,
}: StatBoardStatRowProps) => {
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

    const name = STAT_BOARD_STAT_NAMES[stat]
    const boardName = BOARD_NAMES[board]

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
                    title={`${count.taken} of ${count.total} ${name} nodes taken on ${boardName}`}
                >
                    {count.taken} / {count.total}
                </Text>
            )}

            {/* Ignored shows no tier; the kept one comes back with it. */}
            <StatTierPicker
                value={ignored ? null : tier}
                disabled={ignored}
                label={`${boardName} ${name} priority`}
                onChange={handleTierChange}
            />
        </Flex>
    )
}
