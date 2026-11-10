import { CraftingPage } from "@crafting/CraftingPage"
import { loadCraftingData } from "@crafting/data/craftingData"
import { MAX_CRAFT_COUNT } from "@crafting/config/craftCount"
import { createFileRoute } from "@tanstack/react-router"

type CraftingSearch = {
    // Item id of the recipe open.
    item?: number
    // How many to make; missing is 1.
    count?: number
}

export const Route = createFileRoute("/crafting")({
    validateSearch: (search: Record<string, unknown>): CraftingSearch => {
        const count = Number(search.count)

        return {
            item: Number.isInteger(search.item)
                ? Number(search.item)
                : undefined,
            count:
                Number.isInteger(count) && count > 1 && count <= MAX_CRAFT_COUNT
                    ? count
                    : undefined,
        }
    },
    loader: () => loadCraftingData(),
    // The data is fixed per deploy; search changes need no reload.
    staleTime: Infinity,
    component: CraftingPage,
})
