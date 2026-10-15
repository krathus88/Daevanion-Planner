import { Flex, Text } from "@chakra-ui/react"
import type { LootDetailRow } from "@timers/logic/lootDetails"

type LootDetailLineProps = {
    row: LootDetailRow
    // A nested line: its value sits further in and dimmer, so it doesn't
    // line up with the lines above it.
    nested?: boolean
}

// One line of a loot tooltip: label and detail, then the value at the end.
export const LootDetailLine = ({ row, nested }: LootDetailLineProps) => {
    return (
        <Flex alignItems="baseline" justifyContent="space-between" gap="4">
            <Text color={nested ? "app.muted" : undefined} lineHeight="short">
                {row.label}

                {row.detail && (
                    <Text as="span" color="app.muted">
                        {" "}
                        {row.detail}
                    </Text>
                )}
            </Text>

            <Text
                color={
                    row.valueTone === "effect"
                        ? "app.info"
                        : nested
                          ? "app.subtle"
                          : "app.muted"
                }
                fontVariantNumeric="tabular-nums"
                lineHeight="short"
                textAlign="end"
            >
                {row.value}
            </Text>
        </Flex>
    )
}
