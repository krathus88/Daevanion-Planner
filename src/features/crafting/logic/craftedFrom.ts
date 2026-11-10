import {
    getItem,
    type CraftingData,
    type CraftingItem,
    type Recipe,
} from "@crafting/data/craftingData"

// The step an item comes from, one tier down: for a combo-only item the craft
// that procs it (Artisan's Splendent Sapphire Ring ← Artisan's Sapphire Ring),
// for Transfer Crafting the item it upgrades, its first material (Wise Dragon
// Lord Ring ← Splendent White Dragon Lord Ring, not the Artisan's Splendent
// Sapphire Ring it also takes); else the gear among its materials (Artisan's
// Sapphire Ring ← Expert's Splendent). Plain materials (ore, scales…) aren't
// listed.
export const getCraftedFrom = (data: CraftingData, recipe: Recipe) => {
    const items: CraftingItem[] = []
    const ids = new Set<number>()

    const add = (id: number) => {
        if (id !== recipe.id && !ids.has(id)) {
            ids.add(id)
            items.push(getItem(data, id))
        }
    }

    if (recipe.combo?.only) {
        add(recipe.combo.base)

        return items
    }

    if (recipe.transfer && recipe.materials.length > 0) {
        add(recipe.materials[0][0])

        return items
    }

    for (const [id] of recipe.materials) {
        const category = data.recipes.get(id)?.category

        if (category !== undefined && category !== "materials") {
            add(id)
        }
    }

    return items
}
