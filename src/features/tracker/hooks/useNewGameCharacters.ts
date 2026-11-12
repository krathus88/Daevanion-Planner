import { getNewGameCharacters } from "@account/game/gameCharacters"
import {
    readGameCharacters,
    subscribeToGameSnapshots,
} from "@account/game/gameSync"
import type { TrackerCharacter } from "@tracker/types"
import { useSyncExternalStore } from "react"

// Characters the companion app sent that the tracker lacks and the user
// hasn't declined: the Tracker page asks before adding each.
export const useNewGameCharacters = (
    characters: readonly TrackerCharacter[],
    declined: readonly string[],
) => {
    const lines = useSyncExternalStore(
        subscribeToGameSnapshots,
        readGameCharacters,
    )

    return getNewGameCharacters(lines, characters, declined)
}
