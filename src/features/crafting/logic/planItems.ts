import { getProcs, type CraftingData } from "@crafting/data/craftingData"
import { MERCHANT_PRICES } from "@crafting/config/merchantPrices"
import { isTradable } from "./tradable"

// Every item an item's recipe tree can use, the item and its combo procs
// included, minus bound ones (never on the market) and merchant ones (fixed
// price): what to ask market prices for. Sorted, so the same tree gives the same list.
export const getPlanItemIds = (data: CraftingData, itemId: number) => {
    const seen = new Set<number>()
    const stack = [itemId]

    for (const proc of getProcs(data, itemId)) {
        stack.push(proc.id)
    }

    while (stack.length > 0) {
        const id = stack.pop()

        if (id === undefined || seen.has(id)) {
            continue
        }

        seen.add(id)

        for (const [materialId] of data.recipes.get(id)?.materials ?? []) {
            stack.push(materialId)
        }
    }

    const ids: number[] = []

    for (const id of seen) {
        if (isTradable(data, id) && MERCHANT_PRICES[id] === undefined) {
            ids.push(id)
        }
    }

    return ids.sort((a, b) => a - b)
}
