import { Flex } from "@chakra-ui/react"
import type { ArielPriorityStat } from "@config/stats/stats"
import type { StatTier } from "@planner/config/stats"
import { useArielSettings } from "@planner/hooks/useArielSettings"
import { useArielStatNodeCounts } from "@planner/hooks/useArielStatNodeCounts"
import { StatusText } from "@common/StatusText"
import { ArielStatRow } from "./ArielStatRow"

type ArielStatPriorityListProps = {
    classId: string
    stats: readonly ArielPriorityStat[]
}

export const ArielStatPriorityList = ({
    classId,
    stats,
}: ArielStatPriorityListProps) => {
    const { settings, error, update } = useArielSettings(classId)
    const nodeCounts = useArielStatNodeCounts(classId)

    const handleTierChange = (stat: ArielPriorityStat, tier: StatTier) => {
        update({ ...settings, tiers: { ...settings.tiers, [stat]: tier } })
    }

    return (
        <Flex flexDir="column" gap="2">
            {stats.map((stat) => (
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
