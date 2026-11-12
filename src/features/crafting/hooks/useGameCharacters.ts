import { getServerCharacters } from "@account/game/gameCharacters"
import {
    readGameCharacters,
    subscribeToGameSnapshots,
} from "@account/game/gameSync"
import { useSyncExternalStore } from "react"

// The characters the companion app has sent from this server, with class.
export const useGameCharacters = (server: string) => {
    const lines = useSyncExternalStore(
        subscribeToGameSnapshots,
        readGameCharacters,
    )

    return getServerCharacters(lines, server)
}
