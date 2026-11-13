import { keepUnchanged } from "@common/keepUnchanged"
import { getProcs, type CraftingData } from "@crafting/data/craftingData"
import { MERCHANT_PRICES } from "@crafting/config/merchantPrices"
import { isTradable } from "./tradable"

// Every item an item's recipe tree can use: the item, its combo procs and
// every material down the tree. Sorted, so the same tree gives the same list.
export const getTreeItemIds = (data: CraftingData, itemId: number) => {
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

    return [...seen].sort((a, b) => a - b)
}

// The tree's items minus bound ones (never on the market) and merchant ones
// (fixed price): what to ask market prices for.
export const getPlanItemIds = (data: CraftingData, itemId: number) => {
    return getTreeItemIds(data, itemId).filter((id) => {
        return isTradable(data, id) && MERCHANT_PRICES[id] === undefined
    })
}

let lastOwned: Record<string, number> = {}

// Bag counts of just these items (the open plan's tree): the same object
// while none of them changes, so the companion app's other pickups don't
// rebuild the plan.
export const pickOwned = (
    owned: Record<string, number>,
    ids: readonly number[],
) => {
    const picked: Record<string, number> = {}

    for (const id of ids) {
        const count = owned[id]

        if (count !== undefined) {
            picked[id] = count
        }
    }

    lastOwned = keepUnchanged(lastOwned, picked)

    return lastOwned
}
