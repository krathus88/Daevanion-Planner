import { Flex, Text } from "@chakra-ui/react"
import { ARIEL_STAT_TYPES, type ArielStatType } from "@config/stats/stats"
import { NeedMarker } from "@planner/board/cell/NeedMarker"
import { PreferMarker } from "@planner/board/cell/PreferMarker"
import type { StatTier } from "@planner/config/stats"
import { useArielSettings } from "@planner/hooks/useArielSettings"
import { useArielStatNodeCounts } from "@planner/hooks/useArielStatNodeCounts"
import { StatusText } from "@common/StatusText"
import { Term } from "@common/Term"
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
                Spends <Term>Ariel</Term>&apos;s points on the best{" "}
                <Term>stats</Term>, most value per point first. On the board,{" "}
                <Term>Best</Term> shows <NeedMarker inline /> and{" "}
                <Term>Good</Term> <PreferMarker inline />.
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
