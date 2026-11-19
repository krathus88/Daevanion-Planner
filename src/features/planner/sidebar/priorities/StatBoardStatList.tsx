import { Flex } from "@chakra-ui/react"
import type { StatBoardId } from "@config/boards"
import type { StatBoardStat } from "@config/stats/stats"
import type { StatTier } from "@planner/config/stats"
import { useStatBoardNodeCounts } from "@planner/hooks/useStatBoardNodeCounts"
import { useStatBoardSettings } from "@planner/hooks/useStatBoardSettings"
import { StatusText } from "@common/StatusText"
import { StatBoardStatRow } from "./StatBoardStatRow"

type StatBoardStatListProps = {
    classId: string
    board: StatBoardId
    stats: readonly StatBoardStat[]
}

export const StatBoardStatList = ({
    classId,
    board,
    stats,
}: StatBoardStatListProps) => {
    const { settings, error, update } = useStatBoardSettings(classId, board)
    const nodeCounts = useStatBoardNodeCounts(classId, board)

    const handleTierChange = (stat: StatBoardStat, tier: StatTier) => {
        update({ ...settings, tiers: { ...settings.tiers, [stat]: tier } })
    }

    const handleIgnoredChange = (stat: StatBoardStat, ignored: boolean) => {
        const rest = settings.ignored.filter((other) => other !== stat)
        update({ ...settings, ignored: ignored ? [...rest, stat] : rest })
    }

    return (
        <Flex flexDir="column" gap="2">
            {stats.map((stat) => (
                <StatBoardStatRow
                    key={stat}
                    board={board}
                    stat={stat}
                    tier={settings.tiers[stat] ?? "okay"}
                    ignored={settings.ignored.includes(stat)}
                    count={nodeCounts.counts?.[stat]}
                    onTierChange={handleTierChange}
                    onIgnoredChange={handleIgnoredChange}
                />
            ))}

            {error && <StatusText>{error}</StatusText>}

            {nodeCounts.error && <StatusText>{nodeCounts.error}</StatusText>}
        </Flex>
    )
}
