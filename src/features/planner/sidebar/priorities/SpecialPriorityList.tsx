import { Flex, Text } from "@chakra-ui/react"
import type { MainBoardId } from "@config/boards"
import { useSpecialPriorities } from "@planner/hooks/useSpecialPriorities"
import { SPECIAL_BONUS_TYPES } from "@planner/storage/specialPriorities"
import { StatusText } from "@common/StatusText"
import { LIMIT_COLUMN_WIDTH, PLANNED_COLUMN_WIDTH } from "./abilityColumns"
import { SpecialPriorityRow } from "./SpecialPriorityRow"

type SpecialPriorityListProps = {
    classId: string
    layout?: MainBoardId
}

export const SpecialPriorityList = ({
    classId,
    layout,
}: SpecialPriorityListProps) => {
    const special = useSpecialPriorities(classId, layout)

    const bonuses = SPECIAL_BONUS_TYPES.filter(
        (bonus) =>
            !layout || !special.counts || special.counts[bonus].total > 0,
    )

    return (
        <Flex flexDir="column" alignItems="stretch" gap="2">
            <Text textStyle="hint">Ranked on the same scale as abilities.</Text>

            <Flex justifyContent="flex-end" gap="2" textStyle="caption">
                <Text w={LIMIT_COLUMN_WIDTH} textAlign="center">
                    Rank
                </Text>

                <Flex w={PLANNED_COLUMN_WIDTH} flexShrink="0" />
            </Flex>

            {bonuses.map((bonus) => (
                <SpecialPriorityRow
                    key={bonus}
                    bonus={bonus}
                    priority={special.priorities[bonus]}
                    count={special.counts?.[bonus]}
                    layout={layout}
                    onPriorityChange={special.updatePriority}
                />
            ))}

            {special.error && <StatusText>{special.error}</StatusText>}
        </Flex>
    )
}
