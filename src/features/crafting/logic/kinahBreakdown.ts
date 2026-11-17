import { MARKET_TAX } from "@crafting/config/market"
import type { ComboValue } from "./comboValue"
import type { CraftPlan } from "./craftPlan"
import { formatCount, formatKinah } from "./formatKinah"
import { afterTax } from "./marketTax"

export type KinahRow = {
    label: string
    // Kinah, negative for what's taken off.
    value: number
    // The result of the rows above it.
    total: boolean
}

const oneDecimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })
// Crafts on average close to whole (1.06) need the second decimal.
const twoDecimals = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })

// How one item's profit adds up: its sale, the Market tax, what that pays
// out, the expected cost, and the profit.
export const getProfitRows = (
    sellPrice: number,
    expectedEach: number,
): KinahRow[] => {
    const payout = afterTax(sellPrice)

    return [
        { label: "Sells for", value: sellPrice, total: false },
        {
            label: `Market tax (${MARKET_TAX}%)`,
            value: payout - sellPrice,
            total: false,
        },
        { label: "You get", value: payout, total: true },
        { label: "Expected cost", value: -expectedEach, total: false },
        { label: "Profit", value: payout - expectedEach, total: true },
    ]
}

// How crafting one Splendent adds up: the crafts it takes on average, less
// the regular items they make, sold after tax; empty while unpriced.
export const getCraftItRows = (value: ComboValue): KinahRow[] => {
    if (value.attemptCost === null || value.costPerProc === null) {
        return []
    }

    const crafts: KinahRow = {
        label: `${oneDecimal.format(value.attemptsPerProc)} crafts × ${formatKinah(value.attemptCost)}`,
        value: value.costPerProc,
        total: false,
    }

    if (value.netCostPerProc === null) {
        return [
            crafts,
            { label: "Craft it", value: value.costPerProc, total: true },
        ]
    }

    return [
        crafts,
        {
            label: `About ${oneDecimal.format(value.regularsPerProc)} regular sold, after tax`,
            value: value.netCostPerProc - value.costPerProc,
            total: false,
        },
        { label: "Craft it", value: value.netCostPerProc, total: true },
    ]
}

// What's still to buy once the bag is counted: each priced missing material
// and their total; empty when nothing priced is missing.
export const getToBuyRows = (plan: CraftPlan): KinahRow[] => {
    const rows: KinahRow[] = []

    for (const material of plan.materials) {
        if (material.missing > 0 && material.cost !== null) {
            rows.push({
                label: `${formatCount(material.missing)}× ${material.item.name}`,
                value: material.cost,
                total: false,
            })
        }
    }

    if (rows.length === 0) {
        return rows
    }

    rows.push({ label: "To buy", value: plan.cost, total: true })

    return rows
}

// The expected cost with failures: one craft's cost, then for how many at
// the crafts they take on average.
export const getExpectedRows = (
    attemptCost: number,
    craftsEach: number,
    count: number,
): KinahRow[] => {
    const crafts = craftsEach * count

    return [
        { label: "Per craft", value: attemptCost, total: false },
        {
            label: `Expected for ${formatCount(count)} (${twoDecimals.format(crafts)} crafts on average)`,
            value: attemptCost * crafts,
            total: true,
        },
    ]
}
