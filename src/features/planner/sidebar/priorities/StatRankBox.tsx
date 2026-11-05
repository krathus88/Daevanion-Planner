import { Flex } from "@chakra-ui/react"
import { useDroppable } from "@dnd-kit/react"
import type { MainBoardId } from "@config/boards"
import type { StatType } from "@config/stats/stats"
import type { StatDrop } from "@planner/logic/statListEdits"
import type { StatMax, StatNodeCount } from "@planner/storage/statPriorities"
import { StatPriorityRow } from "./StatPriorityRow"

type StatRankBoxProps = {
    // 0 is the best rank.
    index: number
    stats: StatType[]
    max: Readonly<Record<StatType, StatMax>>
    counts?: Readonly<Record<StatType, StatNodeCount>> | null
    layout?: MainBoardId
    onMaxChange: (stat: StatType, max: StatMax) => void
}

// Stats in one box are worth the same; a stat dropped here joins them.
export const StatRankBox = ({
    index,
    stats,
    max,
    counts,
    layout,
    onMaxChange,
}: StatRankBoxProps) => {
    const { ref, isDropTarget } = useDroppable<StatDrop>({
        id: `rank-${index}`,
        data: { kind: "rank", index: index },
    })

    return (
        <Flex
            ref={ref}
            minW="0"
            px="2.5"
            py="2"
            flexDir="column"
            gap="2"
            layerStyle={isDropTarget ? "listItemActive" : "dropZone"}
        >
            {stats.map((stat) => (
                <StatPriorityRow
                    key={stat}
                    stat={stat}
                    max={max[stat]}
                    count={counts?.[stat]}
                    layout={layout}
                    onMaxChange={onMaxChange}
                />
            ))}
        </Flex>
    )
}
