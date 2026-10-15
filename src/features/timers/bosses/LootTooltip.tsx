import { Flex, Text } from "@chakra-ui/react"
import { GRADE_LABELS } from "@config/items/grades"
import type { LootDrop } from "@timers/config/fieldBossLoot"
import {
    getChestRows,
    getLootChanceLabel,
    getPieceRows,
    getSetTitle,
    getStatRows,
} from "@timers/logic/lootDetails"
import { LootDetails } from "./LootDetails"

type LootTooltipProps = {
    drop: LootDrop
}

// A drop's name, grade and chance, plus what it holds: a set's pieces, a
// chest's contents or an artwork's Pantheon stats.
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

            {/* Top-damage-party drops read in the trophy's gold. */}
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

            {drop.pieces && (
                <LootDetails
                    title={getSetTitle(drop.pieces)}
                    rows={getPieceRows(drop.pieces)}
                />
            )}

            {drop.contents && (
                <LootDetails
                    title="Contents, chance per opening:"
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
