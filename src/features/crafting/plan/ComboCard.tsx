import { Flex, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import { NumberField } from "@common/NumberField"
import {
    getItem,
    type CraftingData,
    type Recipe,
} from "@crafting/data/craftingData"
import { ItemName } from "@crafting/ItemName"
import { getComboValue } from "@crafting/logic/comboValue"
import { ItemMention } from "@crafting/mention/ItemMention"
import { MAX_AMOUNT } from "@crafting/storage/craftingSettings"
import type { PlanSettings } from "@crafting/types"
import { LuSparkles } from "react-icons/lu"
import { ComboOdds } from "./ComboOdds"
import { ComboVerdict } from "./ComboVerdict"

type ComboCardProps = {
    data: CraftingData
    recipe: Recipe
    settings: PlanSettings
    // The plan's attempts at the main craft.
    attempts: number
    splendentId: number
    comboChance: number
    onPriceChange: (itemId: number, price: number | null) => void
}

const oneDecimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })

// The main craft's combo: its odds of making the Splendent item, and whether
// crafting for it beats buying one or pays to sell.
export const ComboCard = ({
    data,
    recipe,
    settings,
    attempts,
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

    return (
        <Card borderColor="app.accent">
            <Flex alignItems="center" gap="2" color="app.accent">
                <LuSparkles aria-hidden />

                <Text textStyle="label" color="app.accent">
                    Combo · {comboChance}%
                </Text>
            </Flex>

            <Flex flexWrap="wrap" alignItems="flex-end" gap="4">
                <Flex minW="0" flex="1" flexDir="column" gap="1.5">
                    <ItemName item={splendent} wrap />

                    <Text color="app.muted" fontSize="sm">
                        Each craft has a {comboChance}% chance to make it
                        instead of <ItemMention item={regular} />: about 1 in{" "}
                        {oneDecimal.format(value.attemptsPerProc)} attempts
                        {value.successKnown
                            ? ", failures included."
                            : " (success taken as 100% until your proficiency is set)."}
                    </Text>
                </Flex>

                {value.splendentTradable && (
                    <Flex w="32">
                        <NumberField
                            value={settings.prices[splendentId] ?? null}
                            label="Its price (Kinah)"
                            fallback={null}
                            max={MAX_AMOUNT}
                            placeholder="—"
                            onChange={handlePriceChange}
                        />
                    </Flex>
                )}
            </Flex>

            <ComboOdds value={value} attempts={attempts} />

            <ComboVerdict
                value={value}
                regular={regular}
                splendent={splendent}
            />
        </Card>
    )
}
