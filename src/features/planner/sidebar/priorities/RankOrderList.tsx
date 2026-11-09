import { Flex, Text } from "@chakra-ui/react"
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
import { Term } from "@common/Term"
import { SameRankOrderRow } from "./SameRankOrderRow"
import { SAME_RANK_ORDER_COLORS } from "./tierColors"

type RankOrderListProps = {
    classId: string
}

export const RankOrderList = ({ classId }: RankOrderListProps) => {
    const { order, error, update } = useRankOrder(classId)

    const handleChange = (group: RankGroup, value: SameRankOrder) => {
        update({ ...order, [group]: value })
    }

    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="hint">
                What goes first when <Term>skills</Term>, <Term>passives</Term>{" "}
                and <Term>special nodes</Term> share a rank. Equal levels go
                cheapest first.
            </Text>

            {RANK_GROUPS.map((group) => (
                <SameRankOrderRow
                    key={group}
                    group={group}
                    value={order[group]}
                    options={SAME_RANK_ORDERS}
                    names={SAME_RANK_ORDER_NAMES}
                    colors={SAME_RANK_ORDER_COLORS}
                    label={RANK_GROUP_NAMES[group]}
                    onChange={handleChange}
                />
            ))}

            {error && <StatusText>{error}</StatusText>}
        </Flex>
    )
}
