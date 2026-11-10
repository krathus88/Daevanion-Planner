import type { CraftingItem } from "@crafting/data/craftingData"
import type { ComboValue } from "./comboValue"
import type { TextPart } from "./textParts"

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
            " sells for (Main craft) to count the ones made on the way.",
        ]
    }

    if (value.splendentTradable && value.splendentPrice === null) {
        return ["Set its price to compare with buying one."]
    }

    return null
}
