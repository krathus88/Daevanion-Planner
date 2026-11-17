import { PROFESSION_NAMES } from "@crafting/config/professions"
import type { Recipe } from "@crafting/data/craftingData"
import { formatMastery } from "./recipeLabels"
import { formatPercent, type SuccessInfo } from "./successChance"

// A finish chance, never rounded up to a sure thing: "94.34%", "99.99%".
export const formatFinish = (chance: number) => {
    return chance < 1 && chance >= 0.99995
        ? "99.99%"
        : formatPercent(chance * 100)
}

// A note under the summary's chances when they aren't plainly the game's
// table at your proficiency, or null.
export const describeOddsHint = (recipe: Recipe, success: SuccessInfo) => {
    const parts: string[] = []

    if (success.source === "unknown") {
        parts.push("Success counts as 100% until your proficiency is set.")
    }

    if (recipe.combo?.only) {
        parts.push(`These count the ${recipe.combo.chance}% combo too.`)
    }

    return parts.length === 0 ? null : parts.join(" ")
}

// Why the game won't let you craft it yet, shown instead of its chances; null
// when it will (or your proficiency isn't set).
export const describeBlocked = (recipe: Recipe, success: SuccessInfo) => {
    if (
        success.difference === null ||
        success.difference >= 0 ||
        recipe.mastery === undefined
    ) {
        return null
    }

    return `You can't craft this yet: it needs ${PROFESSION_NAMES[recipe.profession]} ${formatMastery(recipe.mastery)}.`
}
