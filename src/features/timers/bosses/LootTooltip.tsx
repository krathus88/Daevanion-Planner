import { Flex, Icon, Text } from "@chakra-ui/react"
import { GRADE_LABELS } from "@config/items/grades"
import type { LootDrop } from "@timers/config/fieldBossLoot"
import { LuLock, LuLockOpen } from "react-icons/lu"
import {
    getBindingLabel,
    getChestRows,
    getLootChanceLabel,
    getPieceRows,
    getSetTitle,
    getStatRows,
    isBoundLoot,
} from "@timers/logic/lootDetails"
import { LootDetails } from "./LootDetails"

type LootTooltipProps = {
    drop: LootDrop
}

export const LootTooltip = ({ drop }: LootTooltipProps) => {
    return (
        <Flex p="1" flexDir="column" gap="0.5">
            <Text
                color={`grade.${drop.grade}` as const}
                fontSize="sm"
                fontWeight="semibold"
                lineHeight="short"
            >
                {drop.name}
            </Text>

            <Text color="app.muted" lineHeight="short">
                {GRADE_LABELS[drop.grade]}
                {" · "}

                <Text
                    as="span"
                    color={drop.everyone ? undefined : "app.accent"}
                    fontWeight={drop.everyone ? undefined : "semibold"}
                >
                    {getLootChanceLabel(drop)}
                </Text>
            </Text>

            <Flex
                alignItems="center"
                gap="1"
                color={isBoundLoot(drop) ? "app.danger" : "app.success"}
                fontWeight="semibold"
                lineHeight="short"
            >
                <Icon boxSize="3">
                    {isBoundLoot(drop) ? <LuLock /> : <LuLockOpen />}
                </Icon>

                <Text>{getBindingLabel(drop)}</Text>
            </Flex>

            {drop.pieces && (
                <LootDetails
                    title={getSetTitle(drop.pieces)}
                    rows={getPieceRows(drop.pieces)}
                />
            )}

            {drop.contents && (
                <LootDetails
                    title="Contents (all bound), chance per opening:"
                    rows={getChestRows(drop.contents)}
                />
            )}

            {drop.stats && (
                <LootDetails
                    title="Pantheon stats:"
                    rows={getStatRows(drop.stats)}
                />
            )}
        </Flex>
    )
}
