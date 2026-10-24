import type { ClassAbility } from "@config/classPresets"
import { Flex, Text } from "@chakra-ui/react"
import { formatSearchTime } from "@planner/config/searchTime"

const typeColors = {
    skill: "board.skill",
    passive: "board.passive",
} as const

type AbilityTooltipProps = {
    ability: ClassAbility
    kind: string
}

export const AbilityTooltip = ({ ability, kind }: AbilityTooltipProps) => {
    return (
        <Flex p="1" flexDir="column" gap="0.5">
            <Text fontSize="md" fontWeight="semibold" lineHeight="short">
                {ability.name}
            </Text>

            <Text
                color={typeColors[ability.type]}
                fontSize="sm"
                lineHeight="short"
            >
                {kind}
                {ability.cooldown
                    ? ` · ${formatSearchTime(ability.cooldown)} cooldown`
                    : ""}
            </Text>

            {ability.tooltip && (
                <Text mt="1.5" lineHeight="short" whiteSpace="pre-line">
                    {ability.tooltip}
                </Text>
            )}

            {ability.unlocks && ability.unlocks.length > 0 && (
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
