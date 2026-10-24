import { Flex, Icon, Text } from "@chakra-ui/react"
import { Section } from "@common/Section"
import { FIELD_BOSS_LOOT } from "@timers/config/fieldBossLoot"
import type { FieldBossId } from "@timers/config/fieldBosses"
import { LuLock, LuTrophy } from "react-icons/lu"
import { LootTile } from "./LootTile"

type BossLootProps = {
    bossId: FieldBossId
}

export const BossLoot = ({ bossId }: BossLootProps) => {
    const loot = FIELD_BOSS_LOOT[bossId]

    return (
        <Section variant="sub" title="Loot" count={loot.length}>
            <Text fontSize="xs" lineHeight="tall">
                <Icon
                    boxSize="3.5"
                    mr="1"
                    color="app.accent"
                    verticalAlign="text-bottom"
                >
                    <LuTrophy />
                </Icon>

                <Text as="span" color="app.accent" fontWeight="semibold">
                    Top-damage party only
                </Text>

                <Text as="span" color="app.muted">
                    {" · "}
                </Text>

                <Icon
                    boxSize="3.5"
                    mr="1"
                    color="app.danger"
                    verticalAlign="text-bottom"
                >
                    <LuLock />
                </Icon>

                <Text as="span" color="app.danger" fontWeight="semibold">
                    Bound
                </Text>

                <Text as="span" color="app.muted">
                    {", the rest is unbound · % = chance per kill"}
                </Text>
            </Text>

            <Flex as="ul" flexWrap="wrap" gap="2">
                {loot.map((drop) => (
                    <LootTile key={drop.name} drop={drop} />
                ))}
            </Flex>

            <Text textStyle="hint">
                Loot chest: everyone with contribution. Trophy drops: top-damage
                party only (unconfirmed for EU).
            </Text>
        </Section>
    )
}
