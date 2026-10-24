import { createContext, useContext } from "react"
import type { SharedPlan } from "./shareCode"

export const SharedSettingsContext = createContext<SharedPlan | null>(null)

export const useSharedSettings = () => {
    return useContext(SharedSettingsContext)
}
