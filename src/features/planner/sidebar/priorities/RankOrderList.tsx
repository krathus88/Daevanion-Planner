import { Flex, SegmentGroup, Text } from "@chakra-ui/react"
import { useRankOrder } from "@planner/hooks/useRankOrder"
import {
    RANK_GROUP_NAMES,
    RANK_GROUPS,
    SAME_RANK_ORDER_NAMES,
    SAME_RANK_ORDERS,
    type RankGroup,
    type SameRankOrder,
} from "@planner/storage/rankOrder"
import { StatusText } from "@common/StatusText"
import { SAME_RANK_ORDER_COLORS } from "./tierColors"

type RankOrderListProps = {
    classId: string
}

export const RankOrderList = ({ classId }: RankOrderListProps) => {
    const { order, error, update } = useRankOrder(classId)

    const handleValueChange = (
        group: RankGroup,
        details: SegmentGroup.ValueChangeDetails,
    ) => {
        update({ ...order, [group]: details.value as SameRankOrder })
    }

    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="hint">
                What goes first when skills, passives and special nodes share a
                rank. Equal levels go cheapest first.
            </Text>

            {RANK_GROUPS.map((group) => (
                <Flex key={group} minW="0" alignItems="center" gap="2">
                    <Text minW="0" flex="1" fontSize="sm" truncate>
                        {RANK_GROUP_NAMES[group]}
                    </Text>

                    <SegmentGroup.Root
                        layout="compact"
                        value={order[group]}
                        flexShrink="0"
                        aria-label={`${RANK_GROUP_NAMES[group]} order within a rank`}
                        onValueChange={(details) =>
                            handleValueChange(group, details)
                        }
                    >
                        <SegmentGroup.Indicator />

                        {SAME_RANK_ORDERS.map((value) => (
                            <SegmentGroup.Item
                                key={value}
                                value={value}
                                color="app.subtle"
                                _checked={{
                                    color: SAME_RANK_ORDER_COLORS[value],
                                }}
                                _hover={{
                                    color: SAME_RANK_ORDER_COLORS[value],
                                }}
                            >
                                <SegmentGroup.ItemText>
                                    {SAME_RANK_ORDER_NAMES[value]}
                                </SegmentGroup.ItemText>

                                <SegmentGroup.ItemHiddenInput />
                            </SegmentGroup.Item>
                        ))}
                    </SegmentGroup.Root>
                </Flex>
            ))}

            {error && <StatusText>{error}</StatusText>}
        </Flex>
    )
}
