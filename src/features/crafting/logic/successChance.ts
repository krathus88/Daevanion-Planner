import { PROFESSION_NAMES } from "@crafting/config/professions"
import type { CraftingData, Recipe } from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"

// Where a craft's success chance comes from: Transfer Crafting always
// succeeds; a percent set by hand wins; else the game's Crafting Chance table
// at your proficiency; else (no table or proficiency) it's taken as 100.
type SuccessSource = "transfer" | "manual" | "table" | "unknown"

export type SuccessInfo = {
    // Percent, 0-100.
    value: number
    source: SuccessSource
    // Your proficiency minus the recipe's level, when the table was used;
    // below 0 the game won't let you craft it.
    difference: number | null
}

// A table's chance at a level difference: past its end the last value holds,
// below 0 (not yet allowed) the first.
export const getTableChance = (table: number[], difference: number) => {
    const index = Math.min(Math.max(difference, 0), table.length - 1)

    return table[index]
}

export const getSuccessInfo = (
    data: CraftingData,
    settings: PlanSettings,
    recipe: Recipe,
): SuccessInfo => {
    const manual = settings.success[recipe.id]
    const proficiency = settings.proficiency[recipe.profession]
    const table =
        recipe.chances === undefined
            ? undefined
            : data.chanceTables[recipe.chances]

    if (recipe.transfer) {
        return { value: 100, source: "transfer", difference: null }
    }

    if (manual !== undefined) {
        return {
            value: Math.min(100, Math.max(1, manual)),
            source: "manual",
            difference: null,
        }
    }

    if (table && proficiency !== undefined && recipe.mastery !== undefined) {
        const difference = proficiency - recipe.mastery

        return {
            value: getTableChance(table, difference),
            source: "table",
            difference: difference,
        }
    }

    return { value: 100, source: "unknown", difference: null }
}

export const getRecipeSuccess = (
    data: CraftingData,
    settings: PlanSettings,
    recipe: Recipe,
) => {
    return getSuccessInfo(data, settings, recipe).value
}

const percentFormat = new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 2,
})

// "90.68%".
export const formatPercent = (value: number) => {
    return `${percentFormat.format(value)}%`
}

// The chance to show: a dash while it isn't known (no proficiency set) or
// the game won't allow the craft yet (proficiency below the recipe's level).
export const formatSuccess = (info: SuccessInfo) => {
    if (
        info.source === "unknown" ||
        (info.difference !== null && info.difference < 0)
    ) {
        return "—"
    }

    return formatPercent(info.value)
}

// A line under a craft saying where its success chance comes from, or null
// when there's nothing to say.
export const describeSuccess = (info: SuccessInfo, recipe: Recipe) => {
    const profession = PROFESSION_NAMES[recipe.profession]

    if (info.source === "table" && info.difference !== null) {
        if (info.difference < 0) {
            return `Your ${profession} proficiency is below this recipe's level, so the game won't let you craft it yet.`
        }

        return `${formatPercent(info.value)} success from the game's Crafting Chance table, ${info.difference} ${info.difference === 1 ? "level" : "levels"} above the recipe.`
    }

    if (info.source === "manual") {
        return "Success set by hand; empty the field to use the game's table."
    }

    if (info.source === "unknown" && recipe.chances !== undefined) {
        return `Set your ${profession} proficiency to use the game's Crafting Chance table; until then it counts as 100%.`
    }

    return null
}
