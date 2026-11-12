import type { CompanionLocks } from "@account/game/companionLocks"
import { createContext, useContext } from "react"

// What the companion app fills while it runs (see getCompanionLocks): those
// fields show the game's value and take no input.
export const CompanionLocksContext = createContext<CompanionLocks>({})

export const useIsLocked = (owner: string, id: string) => {
    return useContext(CompanionLocksContext)[owner]?.has(id) ?? false
}

// Characters whose arena counts this week can't be worked out (see
// isArenaWeekUnknown): their arena tasks warn and stay manual until the user
// corrects or confirms them (onConfirm).
export type ArenaUnknown = {
    owners: ReadonlySet<string>
    onConfirm: (owner: string, period: number) => void
}

export const ArenaUnknownContext = createContext<ArenaUnknown>({
    owners: new Set(),
    onConfirm: () => {},
})

export const useArenaUnknown = () => {
    return useContext(ArenaUnknownContext)
}
