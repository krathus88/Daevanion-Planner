import type { CraftPlan } from "./craftPlan"

export type PlanTotals = {
    // Kinah for the priced missing materials; null while none of the missing
    // ones has a price (unknown, not free).
    spend: number | null
    missing: number
    // Materials with no price of their own or by Substance Morph, bag ones
    // included: cost each needs every one.
    unpriced: number
}

export const getPlanTotals = (plan: CraftPlan): PlanTotals => {
    let missing = 0
    let unpriced = 0

    for (const material of plan.materials) {
        if (material.missing > 0) {
            missing++
        }

        if (material.price === null && material.morph === null) {
            unpriced++
        }
    }

    return {
        spend:
            plan.unpriced > 0 && plan.unpriced === missing ? null : plan.cost,
        missing: missing,
        unpriced: unpriced,
    }
}
