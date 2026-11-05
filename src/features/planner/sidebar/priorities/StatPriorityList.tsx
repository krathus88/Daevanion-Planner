import type { ClassPreset } from "@config/classPresets"
import { Flex, Text } from "@chakra-ui/react"
import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react"
import type { MainBoardId } from "@config/boards"
import type { StatType } from "@config/stats/stats"
import { useStatNodeCounts } from "@planner/hooks/useStatNodeCounts"
import { useStatSettings } from "@planner/hooks/useStatSettings"
import {
    dropStat,
    setStatMax,
    type StatDrop,
} from "@planner/logic/statListEdits"
import { isStatType, type StatMax } from "@planner/storage/statPriorities"
import { StatusText } from "@common/StatusText"
import { Term } from "@common/Term"
import { StatRankBoard } from "./StatRankBoard"

type StatPriorityListProps = {
    classPreset: ClassPreset
    layout?: MainBoardId
}

export const StatPriorityList = ({
    classPreset,
    layout,
}: StatPriorityListProps) => {
    const { settings, error, update } = useStatSettings(classPreset.id)
    const nodeCounts = useStatNodeCounts(classPreset.id, layout)

    const handleDragEnd = (event: DragEndEvent) => {
        const id = event.operation.source?.id
        const drop = event.operation.target?.data as StatDrop | undefined
        if (event.canceled || !isStatType(id) || !drop) {
            return
        }

        update(dropStat(settings, id, drop))
    }

    const handleMaxChange = (stat: StatType, max: StatMax) => {
        update(setStatMax(settings, stat, max))
    }

    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="hint">
                Higher ranks are worth more; <Term>stats</Term> in one box are
                worth the same. Drag a stat into a box to join it, or between
                boxes for a new rank.
            </Text>

            <DragDropProvider onDragEnd={handleDragEnd}>
                <StatRankBoard
                    settings={settings}
                    counts={nodeCounts.counts}
                    layout={layout}
                    onMaxChange={handleMaxChange}
                />
            </DragDropProvider>

            {layout ? (
                <Text textStyle="hint">
                    <Term>Max</Term> takes every node of the stat on this board,
                    after the needed nodes. When it goes against ability ranks
                    is set in <Term>All boards</Term>. Other stats only win
                    between routes of equal cost.
                </Text>
            ) : (
                <Text textStyle="hint">
                    <Term>Max</Term> takes every node of the stat before skills
                    and passives ranked after its numbers, or after every
                    ability if empty. Other stats only win between routes of
                    equal cost.
                </Text>
            )}

            {error && <StatusText>{error}</StatusText>}

            {nodeCounts.error && <StatusText>{nodeCounts.error}</StatusText>}
        </Flex>
    )
}
