import type { CompanionLocks } from "@account/game/companionLocks"
import { createContext, useContext } from "react"

// What the companion app fills while it runs (see getCompanionLocks): those
// fields show the game's value and take no input.
export const CompanionLocksContext = createContext<CompanionLocks>({})

export const useIsLocked = (owner: string, id: string) => {
    return useContext(CompanionLocksContext)[owner]?.has(id) ?? false
}

// Arena tasks whose count this week can't be worked out (owner → task ids,
// see isArenaTaskUnknown): each warns and stays manual until the user sets
// or confirms it (onConfirm), one task at a time.
export type ArenaUnknown = {
    tasks: ReadonlyMap<string, ReadonlySet<string>>
    onConfirm: (owner: string, taskId: string, period: number) => void
}

export const ArenaUnknownContext = createContext<ArenaUnknown>({
    tasks: new Map(),
    onConfirm: () => {},
})

export const useArenaUnknown = () => {
    return useContext(ArenaUnknownContext)
}

// Tasks edited in a card since the pointer came into it (see useDoneStash):
// they stay as they are, unlocked, until the user leaves the card, even when
// the edit lets the game fill them (an arena task set by hand).
export const EditingTasksContext = createContext<ReadonlySet<string>>(new Set())

export const useIsEditing = (taskId: string) => {
    return useContext(EditingTasksContext).has(taskId)
}

// A character card's: the companion runs but hasn't read this character's
// corridor entrances since the siege (see getCorridorView): its corridor
// rows warn and stay manual.
export const CorridorsUnknownContext = createContext(false)

export const useCorridorsUnknown = () => {
    return useContext(CorridorsUnknownContext)
}
