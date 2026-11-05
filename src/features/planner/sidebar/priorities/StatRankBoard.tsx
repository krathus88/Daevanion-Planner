import { Flex, Text } from "@chakra-ui/react"
import { useDragOperation } from "@dnd-kit/react"
import type { MainBoardId } from "@config/boards"
import type { StatType } from "@config/stats/stats"
import { statGroups } from "@planner/logic/statOrder"
import type {
    StatMax,
    StatNodeCount,
    StatSettings,
} from "@planner/storage/statPriorities"
import { StatIgnoredBox } from "./StatIgnoredBox"
import { StatRankBox } from "./StatRankBox"
import { StatRankGap } from "./StatRankGap"

type StatRankBoardProps = {
    settings: StatSettings
    counts?: Readonly<Record<StatType, StatNodeCount>> | null
    layout?: MainBoardId
    onMaxChange: (stat: StatType, max: StatMax) => void
}

// Ranks best first, with a gap before, between and after them for new ranks.
export const StatRankBoard = ({
    settings,
    counts,
    layout,
    onMaxChange,
}: StatRankBoardProps) => {
    const { source } = useDragOperation()

    const groups = statGroups(settings)
    const isDragging = Boolean(source)

    return (
        <Flex flexDir="column">
            <StatRankGap index={0} isDragging={isDragging} />

            {groups.length === 0 && (
                <Text textStyle="hint">Drag a stat here to rank it.</Text>
            )}

            {groups.map((group, index) => (
                <Flex key={group[0]} flexDir="column">
                    <StatRankBox
                        index={index}
                        stats={group}
                        max={settings.max}
                        counts={counts}
                        layout={layout}
                        onMaxChange={onMaxChange}
                    />

                    <StatRankGap index={index + 1} isDragging={isDragging} />
                </Flex>
            ))}

            <StatIgnoredBox
                stats={settings.ignored}
                counts={counts}
                layout={layout}
            />
        </Flex>
    )
}
