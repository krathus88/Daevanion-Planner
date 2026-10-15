import type { ClassAbility } from "@config/classPresets"
import { STAT_TOOLTIPS, type StatType } from "@config/stats/stats"
import { Flex, Text } from "@chakra-ui/react"
import {
    POINTS_PER_NODE_TYPE,
    type BoardNodeAppearance,
} from "@planner/config/layouts"
import {
    SPECIAL_BONUSES,
    type SpecialBonusType,
} from "@planner/config/specialNodes"
import { AbilityTooltip } from "@planner/shared/AbilityTooltip"

// The type line matches the node's colour on the board.
const typeColors = {
    basic: "app.fg",
    skill: "board.skill",
    passive: "board.passive",
    special: "board.special",
    start: undefined,
} as const

type NodeTooltipProps = {
    appearance: BoardNodeAppearance
    ability?: ClassAbility
    stat?: StatType
    specialBonus?: SpecialBonusType
    name?: string
}

export const NodeTooltip = ({
    appearance,
    ability,
    stat,
    specialBonus,
    name,
}: NodeTooltipProps) => {
    const kind = `${appearance.name} · ${POINTS_PER_NODE_TYPE[appearance.type]} pts`

    if (ability) {
        return <AbilityTooltip ability={ability} kind={kind} />
    }

    const description =
        (stat && STAT_TOOLTIPS[stat]) ??
        (specialBonus && SPECIAL_BONUSES[specialBonus].tooltip)

    return (
        <Flex p="1" flexDir="column" gap="0.5">
            {name && (
                <Text fontSize="md" fontWeight="semibold" lineHeight="short">
                    {name}
                </Text>
            )}

            <Text
                color={typeColors[appearance.type]}
                fontSize="sm"
                lineHeight="short"
            >
                {kind}
            </Text>

            {description && (
                <Text mt="1.5" lineHeight="short" whiteSpace="pre-line">
                    {description}
                </Text>
            )}
        </Flex>
    )
}
