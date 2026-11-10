import { Flex, Grid, Text } from "@chakra-ui/react"
import { StatTile } from "@common/StatTile"
import { describeComboHint } from "@crafting/logic/comboLabels"
import type { CraftingItem } from "@crafting/data/craftingData"
import type { ComboValue } from "@crafting/logic/comboValue"
import { formatKinah } from "@crafting/logic/formatKinah"
import { ItemText } from "@crafting/mention/ItemText"
import { AmountLoading } from "./AmountLoading"

type ComboVerdictProps = {
    value: ComboValue
    regular: CraftingItem
    // Market prices still loading: every Kinah here may still change.
    pricesLoading: boolean
}

const getTone = (value: number | null) => {
    if (value === null) {
        return undefined
    }

    return value >= 0 ? "success" : "danger"
}

// Kinah per proc by crafting (green when it beats buying one), buying one,
// and the profit per craft selling both; a hint while a price is missing.
export const ComboVerdict = ({
    value,
    regular,
    pricesLoading,
}: ComboVerdictProps) => {
    const crafting = value.netCostPerProc ?? value.costPerProc
    const hint = describeComboHint(value, regular)
    const savings =
        crafting === null || value.splendentPrice === null
            ? null
            : value.splendentPrice - crafting

    const formatAmount = (amount: number | null) => {
        return pricesLoading ? (
            <AmountLoading w="24" h="6" />
        ) : (
            formatKinah(amount)
        )
    }

    return (
        <Flex
            pt="3"
            flexDir="column"
            gap="2"
            borderTopWidth="1px"
            borderColor="app.border"
        >
            <Grid
                templateColumns={{
                    base: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                }}
                gap="4"
            >
                <StatTile
                    value={formatAmount(crafting)}
                    label={
                        value.netCostPerProc === null
                            ? "Crafting one"
                            : "Crafting one, regulars sold"
                    }
                    tone={pricesLoading ? undefined : getTone(savings)}
                />

                {/* Bound items aren't on the market. */}
                {value.splendentTradable && (
                    <StatTile
                        value={formatAmount(value.splendentPrice)}
                        label="Buying one"
                    />
                )}

                {value.splendentTradable && value.regularTradable && (
                    <StatTile
                        value={formatAmount(value.profitPerAttempt)}
                        label="Profit per craft, selling all"
                        tone={
                            pricesLoading
                                ? undefined
                                : getTone(value.profitPerAttempt)
                        }
                    />
                )}
            </Grid>

            {hint && !pricesLoading && (
                <Text textStyle="hint">
                    <ItemText parts={hint} />
                </Text>
            )}
        </Flex>
    )
}
