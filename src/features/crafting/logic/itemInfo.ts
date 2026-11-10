import type { CraftingData } from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"
import { getBuyPrice } from "./craftPlan"
import { formatKinah } from "./formatKinah"
import { describeRecipe } from "./recipeLabels"
import { isTradable } from "./tradable"

// How an item is had: its recipe ("Mace · Blacksmithing Novice Lv. 3 ·
// Combo 25%"), else gathered or bought.
export const describeItemSource = (data: CraftingData, id: number) => {
    const recipe = data.recipes.get(id)

    return recipe ? describeRecipe(data, recipe) : "Gathered or bought"
}

// Its price on your server, by Substance Morph when that's cheaper.
export const describeItemPrice = (
    data: CraftingData,
    settings: PlanSettings,
    id: number,
) => {
    if (!isTradable(data, id)) {
        return "Bound"
    }

    const buy = getBuyPrice(settings, id)

    if (buy.value === null) {
        return "No price set"
    }

    return buy.morph === null
        ? `${formatKinah(buy.value)} each`
        : `${formatKinah(buy.value)} each by Substance Morph`
}
