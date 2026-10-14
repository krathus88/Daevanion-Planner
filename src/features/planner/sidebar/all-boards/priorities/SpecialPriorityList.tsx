import { Flex, Text } from "@chakra-ui/react"
import { useSpecialPriorities } from "@planner/hooks/useSpecialPriorities"
import { SPECIAL_BONUS_TYPES } from "@planner/storage/specialPriorities"
import { StatusText } from "@common/StatusText"
import { LIMIT_COLUMN_WIDTH, PLANNED_COLUMN_WIDTH } from "./abilityColumns"
import { SpecialPriorityRow } from "./SpecialPriorityRow"

type SpecialPriorityListProps = {
    classId: string
}

export const SpecialPriorityList = ({ classId }: SpecialPriorityListProps) => {
    const special = useSpecialPriorities(classId)

    return (
        <Flex flexDir="column" alignItems="stretch" gap="2">
            <Text textStyle="hint">
                Rank each special node bonus on the same scale as abilities.
                Same-rank order sets what goes first when ranks tie. The count
                shows nodes taken across all boards, out of how many exist.
            </Text>

            <Flex justifyContent="flex-end" gap="2" textStyle="caption">
                <Text w={LIMIT_COLUMN_WIDTH} textAlign="center">
                    Rank
                </Text>

                <Flex w={PLANNED_COLUMN_WIDTH} flexShrink="0" />
            </Flex>

            {SPECIAL_BONUS_TYPES.map((bonus) => (
                <SpecialPriorityRow
                    key={bonus}
                    bonus={bonus}
                    priority={special.priorities[bonus]}
                    count={special.counts?.[bonus]}
                    onPriorityChange={special.updatePriority}
                />
            ))}

            {special.error && <StatusText>{special.error}</StatusText>}
        </Flex>
    )
}
