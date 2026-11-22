import { readGameGear, subscribeToGameSnapshots } from "@account/game/gameSync"
import { useSyncExternalStore } from "react"

// Every character's item level and power score the companion app sent, as
// readGameGear's lines (getCharacterGear reads one character's).
export const useGameGear = () => {
    return useSyncExternalStore(subscribeToGameSnapshots, readGameGear)
}
