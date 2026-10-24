import { Flex, Icon, Text } from "@chakra-ui/react"
import type { LootDrop } from "@timers/config/fieldBossLoot"
import { LuTrophy } from "react-icons/lu"

type LootChanceProps = {
    drop: LootDrop
}

export const LootChance = ({ drop }: LootChanceProps) => {
    const showChance = drop.everyone || drop.chance < 100

    return (
        <Flex h="4" alignItems="center" gap="0.5">
            {!drop.everyone && (
                <Icon boxSize="3" color="app.accent">
                    <LuTrophy />
                </Icon>
            )}

            {showChance && (
                <Text
                    textStyle="caption"
                    fontVariantNumeric="tabular-nums"
                    whiteSpace="nowrap"
                >
                    {drop.chance}%
                </Text>
            )}
        </Flex>
    )
}
