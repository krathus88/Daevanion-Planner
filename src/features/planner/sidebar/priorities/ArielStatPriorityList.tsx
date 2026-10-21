import { Flex, Text } from "@chakra-ui/react"
import { ARIEL_STAT_TYPES, type ArielStatType } from "@config/stats/stats"
import type { StatTier } from "@planner/config/stats"
import { useArielSettings } from "@planner/hooks/useArielSettings"
import { useArielStatNodeCounts } from "@planner/hooks/useArielStatNodeCounts"
import { StatusText } from "@common/StatusText"
import { ArielStatRow } from "./ArielStatRow"

type ArielStatPriorityListProps = {
    classId: string
}

// Ariel's own stat tiers, with the nodes its route takes.
export const ArielStatPriorityList = ({
    classId,
}: ArielStatPriorityListProps) => {
    const { settings, error, update } = useArielSettings(classId)
    const nodeCounts = useArielStatNodeCounts(classId)

    const handleTierChange = (stat: ArielStatType, tier: StatTier) => {
        update({ ...settings, tiers: { ...settings.tiers, [stat]: tier } })
    }

    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="hint">
                Find a good path spends Ariel&apos;s points on the best stats it
                can reach, most value per point first. Ignored stats are only
                taken to reach better ones. On the board, 2+ point nodes get a
                blue dot when their stat is Best and a green ring when Good. The
                count shows nodes taken on Ariel, out of how many exist.
            </Text>

            {ARIEL_STAT_TYPES.map((stat) => (
                <ArielStatRow
                    key={stat}
                    stat={stat}
                    tier={settings.tiers[stat]}
                    count={nodeCounts.counts?.[stat]}
                    onTierChange={handleTierChange}
                />
            ))}

            {error && <StatusText>{error}</StatusText>}

            {nodeCounts.error && <StatusText>{nodeCounts.error}</StatusText>}
        </Flex>
    )
}
