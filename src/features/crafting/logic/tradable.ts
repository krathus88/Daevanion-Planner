import type { CraftingData } from "@crafting/data/craftingData"

// Transfer Crafting items (and their Splendent procs, transfer recipes too)
// are bound: they can't be sold or bought on the market: no price, never bought instead.
export const isTradable = (data: CraftingData, id: number) => {
    return data.recipes.get(id)?.transfer !== true
}
