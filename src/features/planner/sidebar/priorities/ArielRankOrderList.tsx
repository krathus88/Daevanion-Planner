import { Flex, Text } from "@chakra-ui/react"
import {
    ARIEL_RANK_GROUP_NAMES,
    ARIEL_RANK_GROUPS,
    type ArielRankGroup,
} from "@planner/config/stats"
import { useArielSettings } from "@planner/hooks/useArielSettings"
import {
    SAME_RANK_ORDER_NAMES,
    SAME_RANK_ORDERS,
    type SameRankOrder,
} from "@planner/storage/rankOrder"
import { StatusText } from "@common/StatusText"
import { Term } from "@common/Term"
import { SameRankOrderRow } from "./SameRankOrderRow"
import { SAME_RANK_ORDER_COLORS } from "./tierColors"

type ArielRankOrderListProps = {
    classId: string
}

export const ArielRankOrderList = ({ classId }: ArielRankOrderListProps) => {
    const { settings, error, update } = useArielSettings(classId)

    const handleChange = (group: ArielRankGroup, value: SameRankOrder) => {
        update({ ...settings, order: { ...settings.order, [group]: value } })
    }

    const handleIgnoredChange = (group: ArielRankGroup, ignored: boolean) => {
        const rest = settings.ignoredGroups.filter((other) => other !== group)
        update({
            ...settings,
            ignoredGroups: ignored ? [...rest, group] : rest,
        })
    }

    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="hint">
                What goes first within a tier. <Term>More</Term> beats{" "}
                <Term>Equal</Term> beats <Term>Less</Term>, whatever the nodes
                cost; equal levels go by the most stats for the fewest points.
                Click a group's name to ignore it, whatever its tiers.
            </Text>

            {ARIEL_RANK_GROUPS.map((group) => (
                <SameRankOrderRow
                    key={group}
                    group={group}
                    value={settings.order[group] as SameRankOrder}
                    options={SAME_RANK_ORDERS}
                    names={SAME_RANK_ORDER_NAMES}
                    colors={SAME_RANK_ORDER_COLORS}
                    ignored={settings.ignoredGroups.includes(group)}
                    label={ARIEL_RANK_GROUP_NAMES[group]}
                    onChange={handleChange}
                    onIgnoredChange={handleIgnoredChange}
                />
            ))}

            {error && <StatusText>{error}</StatusText>}
        </Flex>
    )
}
