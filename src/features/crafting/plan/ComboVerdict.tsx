import { Flex, Grid, Text } from "@chakra-ui/react"
import { StatTile } from "@common/StatTile"
import { describeComboVerdict } from "@crafting/logic/comboLabels"
import type { CraftingItem } from "@crafting/data/craftingData"
import type { ComboValue } from "@crafting/logic/comboValue"
import { formatKinah } from "@crafting/logic/formatKinah"
import { ItemText } from "@crafting/mention/ItemText"

type ComboVerdictProps = {
    value: ComboValue
    regular: CraftingItem
    splendent: CraftingItem
}

const getTone = (value: number | null) => {
    if (value === null) {
        return undefined
    }

    return value >= 0 ? "success" : "danger"
}

// Kinah per proc by crafting against buying one, and the profit of crafting
// to sell both items.
export const ComboVerdict = ({
    value,
    regular,
    splendent,
}: ComboVerdictProps) => {
    const crafting = value.netCostPerProc ?? value.costPerProc
    const verdict = describeComboVerdict(value, regular, splendent)

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
                    value={formatKinah(crafting)}
                    label={
                        value.netCostPerProc === null
                            ? "Crafting one"
                            : `Crafting one, ${regular.name} sold`
                    }
                />

                {/* Bound items aren't on the market. */}
                {value.splendentTradable && (
                    <StatTile
                        value={formatKinah(value.splendentPrice)}
                        label="Buying one"
                    />
                )}

                {value.splendentTradable && value.regularTradable && (
                    <StatTile
                        value={formatKinah(value.profitPerAttempt)}
                        label="Profit per craft, selling both"
                        tone={getTone(value.profitPerAttempt)}
                    />
                )}
            </Grid>

            {verdict.map((line, index) => (
                <Text key={index} textStyle="hint">
                    <ItemText parts={line} />
                </Text>
            ))}
        </Flex>
    )
}
