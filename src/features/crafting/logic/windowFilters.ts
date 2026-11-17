import type { CategoryId, ProfessionId } from "@crafting/config/professions"
import type { CraftingWindow } from "./recipeList"

// What a window's list is narrowed to: kept per window (user-asked), so
// switching windows and back leaves each as it was.
export type WindowFilters = {
    query: string
    profession: ProfessionId | null
    // The profession's tab; null is All.
    category: CategoryId | null
}

const NO_FILTERS: WindowFilters = {
    query: "",
    profession: null,
    category: null,
}

export const EMPTY_WINDOW_FILTERS: Record<CraftingWindow, WindowFilters> = {
    crafting: NO_FILTERS,
    transfer: NO_FILTERS,
}

// One window's filters changed; a new profession starts at All, since each
// has its own tabs.
export const setWindowFilters = (
    filters: Record<CraftingWindow, WindowFilters>,
    craftWindow: CraftingWindow,
    change: Partial<WindowFilters>,
): Record<CraftingWindow, WindowFilters> => {
    const next = { ...filters[craftWindow], ...change }

    if (change.profession !== undefined && change.category === undefined) {
        next.category = null
    }

    return { ...filters, [craftWindow]: next }
}
