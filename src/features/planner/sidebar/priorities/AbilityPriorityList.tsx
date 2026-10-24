import type { ClassAbility, ClassPreset } from "@config/classPresets"
import { Flex, Text } from "@chakra-ui/react"
import type { MainBoardId } from "@config/boards"
import { useAbilityLimits } from "@planner/hooks/useAbilityLimits"
import { StatusText } from "@common/StatusText"
import { AbilityColumnHeaders } from "./AbilityColumnHeaders"
import { AbilityRow } from "./AbilityRow"

type AbilityPriorityListProps = {
    classPreset: ClassPreset
    layout?: MainBoardId
}

export const AbilityPriorityList = ({
    classPreset,
    layout,
}: AbilityPriorityListProps) => {
    const limits = useAbilityLimits(classPreset, layout)

    const isOnBoard = (ability: ClassAbility) => {
        return !layout || (limits.scopedNodeCounts.get(ability.id) ?? 0) > 0
    }

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
                .filter(
                    (ability) =>
                        ability.type === group.type && isOnBoard(ability),
                )
                .sort(byPriority),
        }))
        .filter((group) => group.abilities.length > 0)

    return (
        <Flex flexDir="column" alignItems="stretch" gap="2">
            {layout ? (
                <Text textStyle="hint">
                    1 is the highest rank. Shared with All boards; Min and Max
                    count this board only.
                </Text>
            ) : (
                <Text textStyle="hint">
                    1 is the highest rank. Min reserves upgrades; Max caps how
                    many the optimizer picks.
                </Text>
            )}

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
                            layout={layout}
                        />
                    ))}
                </Flex>
            ))}

            {limits.error && <StatusText>{limits.error}</StatusText>}
        </Flex>
    )
}
