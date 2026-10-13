import type { ClassAbility, ClassPreset } from "@config/classPresets"
import { Flex, Text } from "@chakra-ui/react"
import { useAbilityLimits } from "@planner/hooks/useAbilityLimits"
import { StatusText } from "@common/StatusText"
import { AbilityColumnHeaders } from "./AbilityColumnHeaders"
import { AbilityRow } from "./AbilityRow"

type AbilityPriorityListProps = {
    classPreset: ClassPreset
}

export const AbilityPriorityList = ({
    classPreset,
}: AbilityPriorityListProps) => {
    const limits = useAbilityLimits(classPreset)

    const byPriority = (left: ClassAbility, right: ClassAbility) => {
        return (
            (limits.priorities[left.id] ?? Number.MAX_SAFE_INTEGER) -
            (limits.priorities[right.id] ?? Number.MAX_SAFE_INTEGER)
        )
    }

    const groups = [
        { label: "Skills", type: "skill" },
        { label: "Passives", type: "passive" },
    ]
        .map((group) => ({
            ...group,
            abilities: classPreset.abilities
                .filter((ability) => ability.type === group.type)
                .sort(byPriority),
        }))
        .filter((group) => group.abilities.length > 0)

    return (
        <Flex flexDir="column" alignItems="stretch" gap="2">
            <Text textStyle="hint">
                Rank each ability, 1 being the highest priority. Special board
                nodes are always rank 1. Min reserves at least that many
                upgrades when optimizing all boards; Max stops it choosing more
                (a cheaper route may still pass through extras). The +N column
                shows upgrades already planned across all boards.
            </Text>

            <AbilityColumnHeaders />

            {groups.map((group, index) => (
                <Flex
                    key={group.type}
                    mt={index > 0 ? "2" : undefined}
                    flexDir="column"
                    gap="2"
                >
                    <Text textStyle="label">{group.label}</Text>

                    {group.abilities.map((ability) => (
                        <AbilityRow
                            key={ability.id}
                            ability={ability}
                            limits={limits}
                        />
                    ))}
                </Flex>
            ))}

            {limits.error && <StatusText>{limits.error}</StatusText>}
        </Flex>
    )
}
