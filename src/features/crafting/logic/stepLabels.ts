import { DOUBLE_CHANCES } from "@crafting/config/professions"
import { getItem, type CraftingData } from "@crafting/data/craftingData"
import { formatCount, formatKinah } from "./formatKinah"
import type { CraftStep } from "./craftPlan"
import type { TextPart } from "./textParts"
import { formatSuccess, type SuccessInfo } from "./successChance"

const plural = (count: number, one: string, many: string) => {
    return `${formatCount(count)} ${count === 1 ? one : many}`
}

// What a craft row needs: "3 to make", or "18 needed · 2 in the bag".
export const describeNeed = (step: CraftStep, isTarget: boolean) => {
    const need = `${formatCount(step.need)} ${isTarget ? "to make" : "needed"}`

    return step.owned > 0
        ? `${need} · ${formatCount(step.owned)} in the bag`
        : need
}

// An opened craft's status: "12 needed · 2 crafts of 10 · 98.76% success",
// "— success" while unknown; Transfer Crafting leaves it out (always 100%).
export const describeStepStatus = (
    step: CraftStep,
    isTarget: boolean,
    success: SuccessInfo,
) => {
    const parts = [describeNeed(step, isTarget), describeCrafts(step)]

    if (success.source !== "transfer") {
        parts.push(`${formatSuccess(success)} success`)
    }

    return parts.join(" · ")
}

// How many crafts: "2 crafts of 10 · about 3 attempts"; Cooking adds its
// double chance: "10 crafts, 30% make double".
export const describeCrafts = (step: CraftStep) => {
    const double = DOUBLE_CHANCES[step.recipe.profession]
    const crafts =
        step.recipe.yield > 1
            ? `${plural(step.crafts, "craft", "crafts")} of ${step.recipe.yield}`
            : plural(step.crafts, "craft", "crafts")
    const parts = [double ? `${crafts}, ${double}% make double` : crafts]

    if (step.skipped && step.skipped.count > 0) {
        // Some come straight from the base's combo: fewer of its own.
        const own = step.recipe.transfer
            ? plural(step.attempts, "transfer", "transfers")
            : plural(step.attempts, "attempt", "attempts")

        parts.push(`about ${own}, ${formatCount(step.skipped.count)} by combo`)
    } else if (step.attempts > step.crafts) {
        parts.push(`about ${plural(step.attempts, "attempt", "attempts")}`)
    }

    return parts.join(" · ")
}

// How a combo item is made, and what this step's combos make, with the items
// named; null for a plain recipe.
export const describeCombo = (data: CraftingData, step: CraftStep) => {
    const combo = step.recipe.combo
    const parts: TextPart[] = []

    if (combo) {
        const base = getItem(data, combo.base)

        if (combo.only) {
            parts.push(
                `Not crafted directly: procs ${combo.chance}% of the time when crafting `,
                base,
                ", using these materials.",
            )

            if (step.leftover) {
                parts.push(
                    ` About ${formatCount(step.leftover.count)} `,
                    base,
                    " made on the way.",
                )
            }
        } else if (step.skipped) {
            const what = step.recipe.transfer ? "transfer" : "craft"

            parts.push(
                "Crafting ",
                base,
                ` makes this directly ${combo.chance}% of the time, skipping this ${what}`,
                step.skipped.count > 0
                    ? `: about ${formatCount(step.skipped.count)} of ${formatCount(step.crafts)} come that way, so only the rest need this recipe.`
                    : ".",
            )
        } else {
            parts.push(
                `Can also proc (${combo.chance}%) when crafting `,
                base,
                ".",
            )
        }
    }

    for (const proc of step.procs) {
        parts.push(
            parts.length > 0 ? " " : "",
            proc.count > 0
                ? `Combo Activation Chance ${proc.chance}%: about ${formatCount(proc.count)} of these crafts make `
                : `Combo Activation Chance ${proc.chance}%: a craft can make `,
            proc.item,
            ".",
        )
    }

    return parts.length > 0 ? parts : null
}

// A material priced at the Odyle it's Substance Morphed from.
export const describeMorph = (odyleName: string, price: number) => {
    return `Cheaper from ${odyleName} by Substance Morph (1 for 1): counted at ${formatKinah(price)} each.`
}
