import type { CraftingItem } from "@crafting/data/craftingData"
import { MARKET_TAX } from "@crafting/config/market"
import type { ComboValue } from "./comboValue"
import { formatCount, formatKinah } from "./formatKinah"
import type { TextPart } from "./textParts"

// The combo card's lines under its numbers, items named: how a proc's cost
// adds up, which is cheaper, and what crafting to sell makes; else what to
// price first.
export const describeComboVerdict = (
    value: ComboValue,
    regular: CraftingItem,
    splendent: CraftingItem,
) => {
    if (value.attemptCost === null || value.costPerProc === null) {
        return [["Price every material to see what a proc costs."]]
    }

    const lines: TextPart[][] = []
    const attempts = formatCount(Math.round(value.attemptsPerProc * 10) / 10)
    const net = value.netCostPerProc
    const cost: TextPart[] = [
        `About ${attempts} attempts at ${formatKinah(value.attemptCost)}: ${formatKinah(value.costPerProc)} per `,
        splendent,
    ]

    if (net !== null) {
        lines.push([
            ...cost,
            `, ${formatKinah(net)} once the `,
            regular,
            ` made on the way are sold (after ${MARKET_TAX}% tax).`,
        ])
    } else if (value.regularTradable) {
        lines.push([
            ...cost,
            ". Set what ",
            regular,
            " sells for (Main craft) to take off the regular ones made on the way.",
        ])
    } else {
        lines.push([...cost, "."])
    }

    if (value.splendentPrice !== null) {
        const difference = value.splendentPrice - (net ?? value.costPerProc)

        lines.push([
            difference >= 0
                ? `Crafting for it is cheaper than buying one by ${formatKinah(difference)}.`
                : `Buying one is cheaper than crafting for it by ${formatKinah(-difference)}.`,
        ])
    }

    if (!value.splendentTradable) {
        lines.push([splendent, " is bound."])
    } else if (value.profitPerAttempt === null && value.regularTradable) {
        lines.push([
            "Set both prices (its price above, Sells for on the main craft) to see the profit of crafting to sell.",
        ])
    } else if (value.profitPerAttempt !== null) {
        lines.push([
            `Crafting 100 to sell everything made: about ${formatKinah(value.profitPerAttempt * 100)} ${value.profitPerAttempt >= 0 ? "profit" : "lost"} after ${MARKET_TAX}% tax.`,
        ])
    }

    return lines
}
