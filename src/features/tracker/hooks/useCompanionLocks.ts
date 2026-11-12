import {
    getCompanionLocks,
    type CompanionLocks,
} from "@account/game/companionLocks"
import type { CompanionStatus } from "@account/game/companionStatus"
import {
    readGameSections,
    subscribeToGameSnapshots,
} from "@account/game/gameSync"
import type { TrackerCharacter, TrackerData, TrackerTask } from "@tracker/types"
import { useSyncExternalStore } from "react"

const NONE: CompanionLocks = {}

// The fields the companion app fills, only while it's running.
export const useCompanionLocks = (
    status: CompanionStatus,
    characters: readonly TrackerCharacter[],
    tasks: readonly TrackerTask[],
    arena: TrackerData["arena"],
    week: number,
) => {
    const sections = useSyncExternalStore(
        subscribeToGameSnapshots,
        readGameSections,
    )

    return status.state === "running"
        ? getCompanionLocks(sections, characters, tasks, arena, week)
        : NONE
}
