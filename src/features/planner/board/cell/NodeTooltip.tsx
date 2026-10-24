import type { ClassAbility } from "@config/classPresets"
import { BOARD_STAT_TOOLTIPS, type BoardStat } from "@config/stats/stats"
import { Flex, Text } from "@chakra-ui/react"
import {
    appearanceCost,
    type BoardNodeAppearance,
} from "@planner/config/layouts"
import {
    SPECIAL_BONUSES,
    type SpecialBonusType,
} from "@planner/config/specialNodes"
import { AbilityTooltip } from "@planner/shared/AbilityTooltip"

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
    stat?: BoardStat
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
    const kind = `${appearance.name} · ${appearanceCost(appearance)} pts`

    if (ability) {
        return <AbilityTooltip ability={ability} kind={kind} />
    }

    const description =
        (stat && BOARD_STAT_TOOLTIPS[stat]) ??
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
