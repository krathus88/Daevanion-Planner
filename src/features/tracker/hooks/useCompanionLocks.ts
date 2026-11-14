import { getCompanionLocks } from "@account/game/companionLocks"
import {
    readGameSections,
    subscribeToGameSnapshots,
} from "@account/game/gameSync"
import type { TrackerCharacter, TrackerData, TrackerTask } from "@tracker/types"
import { useSyncExternalStore } from "react"

// The fields the companion app fills: locked once it has sent game data,
// running now or not (no snapshots, no locks).
export const useCompanionLocks = (
    characters: readonly TrackerCharacter[],
    tasks: readonly TrackerTask[],
    arena: TrackerData["arena"],
    week: number,
) => {
    const sections = useSyncExternalStore(
        subscribeToGameSnapshots,
        readGameSections,
    )

    return getCompanionLocks(sections, characters, tasks, arena, week)
}
