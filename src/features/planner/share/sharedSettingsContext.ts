import { createContext, useContext } from "react"
import type { SharedPlan } from "./shareCode"

// Settings from a settings-only share link, shown in place of the sidebar's
// tabs while the viewer's own board stays on screen.
export const SharedSettingsContext = createContext<SharedPlan | null>(null)

export const useSharedSettings = () => {
    return useContext(SharedSettingsContext)
}
