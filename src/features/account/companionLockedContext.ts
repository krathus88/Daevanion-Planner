import { createContext, useContext } from "react"

// Whether the companion app fills a page's fields right now (Pets: levels
// and souls; Crafting: bag counts), so they show the game's value and take
// no input. The Tracker locks per field instead (tracker/context).
export const CompanionLockedContext = createContext(false)

export const useCompanionLocked = () => {
    return useContext(CompanionLockedContext)
}
