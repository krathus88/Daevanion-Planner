import {
    CATEGORY_NAMES,
    LEVELS_PER_RANK,
    PROFESSION_NAMES,
    RANK_NAMES,
    RANK_SHORT_NAMES,
} from "@crafting/config/professions"
import {
    getProcs,
    type CraftingData,
    type Recipe,
} from "@crafting/data/craftingData"

// Mastery as the game shows it: 60 is "Professional Lv. 10".
export const formatMastery = (mastery: number) => {
    const rank = Math.floor((mastery - 1) / LEVELS_PER_RANK)
    const level = mastery - rank * LEVELS_PER_RANK
    const name = RANK_NAMES[rank] ?? `Rank ${rank + 1}`

    return `${name} Lv. ${level}`
}

// Mastery short, for the recipe list: "Lv. 15", "Pro 5" (Professional).
export const formatShortMastery = (mastery: number) => {
    const rank = Math.floor((mastery - 1) / LEVELS_PER_RANK)
    const level = mastery - rank * LEVELS_PER_RANK

    return rank === 0
        ? `Lv. ${level}`
        : `${RANK_SHORT_NAMES[rank] ?? `R${rank + 1}`} ${level}`
}

// "Mace · Blacksmithing Novice Lv. 3 · Combo 25%". Combo is the chance its
// crafts proc a Splendent item, like the game's Combo Activation Chance; a
// Splendent item says it comes from a combo.
export const describeRecipe = (data: CraftingData, recipe: Recipe) => {
    const procs = getProcs(data, recipe.id)
    const profession = PROFESSION_NAMES[recipe.profession]
    const parts: string[] = []

    if (recipe.category) {
        parts.push(CATEGORY_NAMES[recipe.category])
    }

    if (recipe.transfer) {
        parts.push(`${profession} Transfer Crafting`)
    } else {
        parts.push(
            recipe.mastery === undefined
                ? profession
                : `${profession} ${formatMastery(recipe.mastery)}`,
        )
    }

    if (procs.length > 0) {
        parts.push(`Combo ${procs[0].chance}%`)
    }

    if (recipe.combo) {
        parts.push(recipe.combo.only ? "Combo item" : "Also from combo")
    }

    return parts.join(" · ")
}
