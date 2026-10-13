import type { ClassAbility } from "@config/classPresets"
import { Flex, Text } from "@chakra-ui/react"
import {
    POINTS_PER_NODE_TYPE,
    type BoardNodeAppearance,
} from "@planner/config/layouts"
import { formatSearchTime } from "@planner/config/searchTime"
import {
    SPECIAL_BONUSES,
    type SpecialBonusType,
} from "@planner/config/specialNodes"
import { STAT_TOOLTIPS, type StatType } from "@planner/config/stats"

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
    const description =
        ability?.tooltip ??
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
                color={typeColors[ability?.type ?? appearance.type]}
                fontSize="sm"
                lineHeight="short"
            >
                {appearance.name} · {POINTS_PER_NODE_TYPE[appearance.type]} pts
                {ability?.cooldown
                    ? ` · ${formatSearchTime(ability.cooldown)} cooldown`
                    : ""}
            </Text>

            {description && (
                <Text mt="1.5" lineHeight="short" whiteSpace="pre-line">
                    {description}
                </Text>
            )}

            {ability?.unlocks && ability.unlocks.length > 0 && (
                <Flex
                    mt="2"
                    pt="2"
                    flexDir="column"
                    gap="1"
                    borderColor="app.border"
                    borderTopWidth="1px"
                >
                    {ability.unlocks.map((unlock, index) => (
                        <Flex key={index} gap="2">
                            <Text
                                w="9"
                                flexShrink="0"
                                color="app.muted"
                                fontWeight="semibold"
                                lineHeight="short"
                            >
                                Lv {unlock.level}
                            </Text>

                            <Text lineHeight="short">{unlock.effect}</Text>
                        </Flex>
                    ))}
                </Flex>
            )}
        </Flex>
    )
}
