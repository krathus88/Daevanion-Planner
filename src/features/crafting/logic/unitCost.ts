import type { CraftingData } from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"
import {
    getAverageYield,
    getBuyPrice,
    getCraftChance,
    getSkipChance,
} from "./craftPlan"
import { getRecipeSuccess } from "./successChance"
import { isTradable } from "./tradable"

// Average Kinah to craft one of an item from priced materials, on average
// over failures and combo procs (every attempt uses every material);
// materials marked bought (or not craftable) count at their
// price, or their Odyle's when Substance Morph is cheaper. Null when any
// material has no price.
export const getCraftCost = (
    data: CraftingData,
    settings: PlanSettings,
    id: number,
) => {
    const costs = new Map<number, number | null>()
    const visiting = new Set<number>()

    // As the plan has it: crafted unless bought instead (and on the market).
    const isCrafted = (itemId: number) => {
        return (
            data.recipes.has(itemId) &&
            (!isTradable(data, itemId) || !settings.bought.includes(itemId))
        )
    }

    const getCost = (itemId: number, crafted: boolean): number | null => {
        const recipe = data.recipes.get(itemId)

        if (!crafted || !recipe) {
            return getBuyPrice(settings, itemId).value
        }

        const known = costs.get(itemId)

        if (known !== undefined) {
            return known
        }

        // A recipe that needs its own item can't be priced by crafting.
        if (visiting.has(itemId)) {
            return getBuyPrice(settings, itemId).value
        }

        visiting.add(itemId)

        const success = getRecipeSuccess(data, settings, recipe)
        const chance = getCraftChance(recipe, success)
        const skip = getSkipChance(recipe, (baseId) => {
            return isCrafted(baseId)
        })
        // Per item made: every attempt uses all the materials (a combo's
        // lower-tier gear too, even when it doesn't proc). An item its base's combo
        // can make directly needs this recipe only the rest of the time, and
        // one base craft either way.
        const attemptsEach = (1 - skip) / chance
        const baseEach = attemptsEach + skip
        let total: number | null = 0

        for (const [materialId, count] of recipe.materials) {
            const materialCost = getCost(materialId, isCrafted(materialId))

            if (materialCost === null) {
                total = null

                break
            }

            total +=
                materialCost *
                count *
                (skip > 0 && materialId === recipe.combo?.base
                    ? baseEach
                    : attemptsEach)
        }

        visiting.delete(itemId)

        const cost = total === null ? null : total / getAverageYield(recipe)

        costs.set(itemId, cost)

        return cost
    }

    return getCost(id, true)
}

// Average Kinah for one of an item as the plan gets it: crafted (unless
// bought instead, and on the market), else bought.
export const getItemCost = (
    data: CraftingData,
    settings: PlanSettings,
    id: number,
) => {
    const crafted =
        data.recipes.has(id) &&
        (!isTradable(data, id) || !settings.bought.includes(id))

    return crafted
        ? getCraftCost(data, settings, id)
        : getBuyPrice(settings, id).value
}
