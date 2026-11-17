import type { CraftingItem } from "@crafting/data/craftingData"
import type { ComboValue } from "./comboValue"
import { formatKinah } from "./formatKinah"
import { formatPercent } from "./successChance"
import type { TextPart } from "./textParts"

const oneDecimal = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })

// The one line under the combo card's numbers: the price still missing for
// them, if any.
export const describeComboHint = (
    value: ComboValue,
    regular: CraftingItem,
): TextPart[] | null => {
    if (value.costPerProc === null) {
        return ["Price every material to see what a proc costs."]
    }

    if (value.netCostPerProc === null && value.regularTradable) {
        return [
            "Set what ",
            regular,
            " sells for (beside the profit above) to count the ones made on the way.",
        ]
    }

    if (value.splendentTradable && value.splendentPrice === null) {
        return ["No market price for it: set its price under Buy it."]
    }

    return null
}

// A craft's chance at the Splendent: "Each craft: 21.8% chance (25% ×
// 87.2% success), about 1 in 4.6".
export const describeComboChance = (value: ComboValue, comboChance: number) => {
    const chance = formatPercent(Math.round(value.procChance * 1000) / 10)
    const every = `about 1 in ${oneDecimal.format(value.attemptsPerProc)}`

    if (!value.successKnown) {
        return `Each craft: ${chance} chance at 100% success, ${every}`
    }

    if (value.success >= 100) {
        return `Each craft: ${chance} chance, ${every}`
    }

    return `Each craft: ${chance} chance (${comboChance}% × ${formatPercent(value.success)} success), ${every}`
}

// Which way is cheaper: "Crafting is 4,787,679 Kinah cheaper"; null while a
// side is unknown.
export const describeComboVerdict = (
    crafting: number | null,
    buying: number | null,
) => {
    if (crafting === null || buying === null) {
        return null
    }

    const difference = Math.abs(buying - crafting)

    if (Math.round(difference) === 0) {
        return {
            text: "Crafting and buying cost the same",
            cheaperToCraft: true,
        }
    }

    return crafting < buying
        ? {
              text: `Crafting is ${formatKinah(difference)} cheaper`,
              cheaperToCraft: true,
          }
        : {
              text: `Buying is ${formatKinah(difference)} cheaper`,
              cheaperToCraft: false,
          }
}
