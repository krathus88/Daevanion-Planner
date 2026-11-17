import { Flex, Grid, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import {
    getItem,
    type CraftingData,
    type Recipe,
} from "@crafting/data/craftingData"
import { ItemName } from "@crafting/ItemName"
import { ItemText } from "@crafting/mention/ItemText"
import {
    describeComboChance,
    describeComboHint,
} from "@crafting/logic/comboLabels"
import { getComboValue } from "@crafting/logic/comboValue"
import { arePricesLoading, getPriceState } from "@crafting/logic/craftPlan"
import type { PlanSettings } from "@crafting/types"
import { LuSparkles } from "react-icons/lu"
import { ComboOdds } from "./ComboOdds"
import { ComboSellAll } from "./ComboSellAll"
import { ComboVerdict } from "./ComboVerdict"

type ComboCardProps = {
    data: CraftingData
    recipe: Recipe
    settings: PlanSettings
    splendentId: number
    comboChance: number
    onPriceChange: (itemId: number, price: number | null) => void
}

// The main craft's combo: its odds of making the Splendent item, and whether
// crafting for it beats buying one or pays to sell.
export const ComboCard = ({
    data,
    recipe,
    settings,
    splendentId,
    comboChance,
    onPriceChange,
}: ComboCardProps) => {
    const handlePriceChange = (price: number | null) => {
        onPriceChange(splendentId, price)
    }

    const splendent = getItem(data, splendentId)
    const regular = getItem(data, recipe.id)
    const value = getComboValue(
        data,
        settings,
        recipe,
        splendentId,
        comboChance,
    )

    if (!value) {
        return null
    }

    const pricesLoading = arePricesLoading(settings)
    const hint = describeComboHint(value, regular)

    return (
        <Card borderColor="app.accent">
            <Flex alignItems="center" gap="2" color="app.accent">
                <LuSparkles aria-hidden />

                <Text textStyle="label" color="app.accent">
                    Combo · {comboChance}%
                </Text>
            </Flex>

            <Grid
                templateColumns={{
                    base: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                }}
                columnGap="8"
                rowGap="4"
            >
                <Flex minW="0" flexDir="column" gap="2">
                    <ItemName item={splendent} wrap />

                    <Text color="app.muted" fontSize="sm">
                        {describeComboChance(value, comboChance)}
                    </Text>

                    <ComboOdds value={value} />
                </Flex>

                <ComboVerdict
                    value={value}
                    priceState={getPriceState(settings, splendentId)}
                    pricesLoading={pricesLoading}
                    onPriceChange={handlePriceChange}
                />
            </Grid>

            {value.profitPerAttempt !== null && !pricesLoading && (
                <ComboSellAll profit={value.profitPerAttempt} />
            )}

            {hint && !pricesLoading && (
                <Text textStyle="hint">
                    <ItemText parts={hint} />
                </Text>
            )}
        </Card>
    )
}
