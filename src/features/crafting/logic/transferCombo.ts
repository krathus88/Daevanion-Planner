import {
    getItem,
    type CraftingData,
    type CraftingItem,
} from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"
import { getItemCost } from "./unitCost"

export type TransferCombo = {
    // Chance, 0-1, a transfer makes the Splendent item straight away.
    chance: number
    // What transferring the regular item into the Splendent one takes
    // besides it: only needed when the proc misses.
    materials: { item: CraftingItem; count: number }[]
    // Kinah for those materials; null while one has no price.
    extraCost: number | null
}

// A Transfer Crafting combo (White Dragon Lord Ring → Splendent White): a
// proc skips the next transfer, so it's worth that transfer's other
// materials. Null when the Splendent item isn't made from this one.
export const getTransferCombo = (
    data: CraftingData,
    settings: PlanSettings,
    baseId: number,
    splendentId: number,
    comboChance: number,
): TransferCombo | null => {
    const recipe = data.recipes.get(splendentId)

    if (!recipe || !recipe.materials.some(([id]) => id === baseId)) {
        return null
    }

    const materials: TransferCombo["materials"] = []
    let extraCost: number | null = 0

    for (const [id, count] of recipe.materials) {
        if (id === baseId) {
            continue
        }

        const cost = getItemCost(data, settings, id)

        materials.push({ item: getItem(data, id), count: count })
        extraCost =
            extraCost === null || cost === null
                ? null
                : extraCost + cost * count
    }

    return {
        chance: comboChance / 100,
        materials: materials,
        extraCost: extraCost,
    }
}
