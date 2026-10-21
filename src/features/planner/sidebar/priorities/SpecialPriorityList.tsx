import { Flex, Text } from "@chakra-ui/react"
import type { MainBoardId } from "@config/boards"
import { useSpecialPriorities } from "@planner/hooks/useSpecialPriorities"
import { SPECIAL_BONUS_TYPES } from "@planner/storage/specialPriorities"
import { StatusText } from "@common/StatusText"
import { LIMIT_COLUMN_WIDTH, PLANNED_COLUMN_WIDTH } from "./abilityColumns"
import { scopeLabel } from "./scopeLabel"
import { SpecialPriorityRow } from "./SpecialPriorityRow"

type SpecialPriorityListProps = {
    classId: string
    // Counts nodes on this board only and hides bonuses it lacks.
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
            <Text textStyle="hint">
                Rank each special node bonus on the same scale as abilities.
                Same-rank order sets what goes first when ranks tie. The count
                shows nodes taken {scopeLabel(layout)}, out of how many exist
                {layout && "; bonuses with no nodes here are hidden"}.
            </Text>

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
