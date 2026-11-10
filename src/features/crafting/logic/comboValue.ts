import type { CraftingData, Recipe } from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"
import { getAverageYield, getCraftChance, getPrice } from "./craftPlan"
import { afterTax } from "./marketTax"
import { getSuccessInfo } from "./successChance"
import { isTradable } from "./tradable"
import { getCraftCost } from "./unitCost"

// How sure to be of at least one proc: crafts needed for each.
const CONFIDENCES = [50, 75, 90, 95]

export type ComboValue = {
    // Chance one attempt makes the Splendent item, 0-1: success x combo.
    procChance: number
    // Chance one attempt makes the regular item instead.
    regularChance: number
    // Success is known: the game's table, set by hand, or Transfer Crafting
    // (always 100%); else taken as 100% until a proficiency is set.
    successKnown: boolean
    // Attempts for one proc on average.
    attemptsPerProc: number
    // Crafts for a 50/75/90/95% chance of at least one.
    craftsFor: { confidence: number; crafts: number }[]
    // Kinah one attempt uses; null while a material has no price.
    attemptCost: number | null
    // Null too when the market doesn't sell it (Transfer Crafting).
    regularPrice: number | null
    splendentPrice: number | null
    regularTradable: boolean
    splendentTradable: boolean
    // Kinah per Splendent by crafting: all attempts' materials, and that less
    // what the regular items made on the way sell for after the Market tax.
    costPerProc: number | null
    netCostPerProc: number | null
    // Average Kinah per attempt when selling everything made, after tax.
    profitPerAttempt: number | null
}

// Chance of at least one proc in a number of attempts.
export const getProcOdds = (procChance: number, attempts: number) => {
    return 1 - (1 - procChance) ** attempts
}

const getCraftsFor = (procChance: number, confidence: number) => {
    if (procChance >= 1) {
        return 1
    }

    return Math.ceil(
        Math.log(1 - confidence / 100) / Math.log(1 - procChance) - 1e-9,
    )
}

// Crafting a base item (e.g. Artisan's Sapphire Ring) for its combo proc
// (Artisan's Splendent Sapphire Ring): the odds, what a proc costs against
// buying one, and what crafting to sell both earns.
export const getComboValue = (
    data: CraftingData,
    settings: PlanSettings,
    recipe: Recipe,
    splendentId: number,
    comboChance: number,
): ComboValue | null => {
    const success = getSuccessInfo(data, settings, recipe)
    const successRate = success.value / 100
    const procChance = successRate * (comboChance / 100)

    if (procChance <= 0) {
        return null
    }

    const regularChance = successRate - procChance
    const craftCost = getCraftCost(data, settings, recipe.id)
    // Cost each is per successful craft; back to per attempt.
    const attemptCost =
        craftCost === null
            ? null
            : craftCost *
              getAverageYield(recipe) *
              getCraftChance(recipe, success.value)
    const regularTradable = isTradable(data, recipe.id)
    const splendentTradable = isTradable(data, splendentId)
    const regularPrice = regularTradable ? getPrice(settings, recipe.id) : null
    const splendentPrice = splendentTradable
        ? getPrice(settings, splendentId)
        : null
    const craftsFor: ComboValue["craftsFor"] = []

    for (const confidence of CONFIDENCES) {
        craftsFor.push({
            confidence: confidence,
            crafts: getCraftsFor(procChance, confidence),
        })
    }

    return {
        procChance: procChance,
        regularChance: regularChance,
        // Transfer Crafting always succeeds.
        successKnown: success.source !== "unknown",
        attemptsPerProc: 1 / procChance,
        craftsFor: craftsFor,
        attemptCost: attemptCost,
        regularPrice: regularPrice,
        splendentPrice: splendentPrice,
        regularTradable: regularTradable,
        splendentTradable: splendentTradable,
        costPerProc: attemptCost === null ? null : attemptCost / procChance,
        netCostPerProc:
            attemptCost === null || regularPrice === null
                ? null
                : (attemptCost - regularChance * afterTax(regularPrice)) /
                  procChance,
        profitPerAttempt:
            attemptCost === null ||
            regularPrice === null ||
            splendentPrice === null
                ? null
                : procChance * afterTax(splendentPrice) +
                  regularChance * afterTax(regularPrice) -
                  attemptCost,
    }
}
