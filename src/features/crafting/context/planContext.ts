import { createContext, useContext } from "react"
import type { CraftingData } from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"

// What an item mention's hover card reads: the recipes and your prices.
export type PlanContextValue = {
    data: CraftingData
    settings: PlanSettings
}

export const PlanContext = createContext<PlanContextValue | null>(null)

export const usePlanContext = () => {
    const plan = useContext(PlanContext)

    if (!plan) {
        throw new Error("usePlanContext must be used inside a PlanContext.")
    }

    return plan
}
