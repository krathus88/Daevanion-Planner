import { Flex, Text } from "@chakra-ui/react"
import { useDroppable } from "@dnd-kit/react"
import type { MainBoardId } from "@config/boards"
import type { StatType } from "@config/stats/stats"
import type { StatDrop } from "@planner/logic/statListEdits"
import type { StatNodeCount } from "@planner/storage/statPriorities"
import { StatPriorityRow } from "./StatPriorityRow"

type StatIgnoredBoxProps = {
    stats: StatType[]
    counts?: Readonly<Record<StatType, StatNodeCount>> | null
    layout?: MainBoardId
}

export const StatIgnoredBox = ({
    stats,
    counts,
    layout,
}: StatIgnoredBoxProps) => {
    const { ref, isDropTarget } = useDroppable<StatDrop>({
        id: "ignored",
        data: { kind: "ignored" },
    })

    return (
        <Flex mt="1" flexDir="column" gap="1">
            <Text
                ps="1"
                textStyle="label"
                fontSize="2xs"
                letterSpacing="widest"
            >
                Ignored
            </Text>

            <Flex
                ref={ref}
                px="2.5"
                py="2"
                flexDir="column"
                gap="2"
                borderWidth="1px"
                borderStyle="dashed"
                borderColor={isDropTarget ? "app.accent" : "app.borderStrong"}
                borderRadius="md"
            >
                {stats.length === 0 && (
                    <Text textStyle="hint">Drag a stat here to ignore it.</Text>
                )}

                {stats.map((stat) => (
                    <StatPriorityRow
                        key={stat}
                        stat={stat}
                        count={counts?.[stat]}
                        layout={layout}
                    />
                ))}
            </Flex>
        </Flex>
    )
}
