import type { CraftingData } from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"
import { arePricesLoading, getBuyPrice, getListedPrice } from "./craftPlan"
import { formatKinah } from "./formatKinah"
import { describeRecipe } from "./recipeLabels"
import { isTradable } from "./tradable"

// How an item is had: its recipe ("Mace · Blacksmithing Novice Lv. 3 ·
// Combo 25%"), else gathered or bought.
export const describeItemSource = (data: CraftingData, id: number) => {
    const recipe = data.recipes.get(id)

    return recipe ? describeRecipe(data, recipe) : "Gathered or bought"
}

// Its price (a merchant's, the market's, else set by hand), by Substance Morph
// when that's cheaper.
export const describeItemPrice = (
    data: CraftingData,
    settings: PlanSettings,
    id: number,
) => {
    if (!isTradable(data, id)) {
        return "Bound"
    }

    const buy = getBuyPrice(settings, id)
    const listed = getListedPrice(settings, id)

    // Only a merchant's price is sure before the market answers.
    if (listed?.source !== "merchant" && arePricesLoading(settings)) {
        return "Loading the market price…"
    }

    if (buy.value === null) {
        return "No price set"
    }

    if (buy.morph !== null) {
        return `${formatKinah(buy.value)} each by Substance Morph`
    }

    if (listed?.source === "merchant") {
        return `${formatKinah(buy.value)} each from a merchant`
    }

    return listed
        ? `${formatKinah(buy.value)} each on the market`
        : `${formatKinah(buy.value)} each`
}
