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
                Spends Ariel&apos;s points on the best stats, most value per
                point first. On the board, Best shows a blue dot and Good a
                green ring.
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
