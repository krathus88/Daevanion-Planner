import { hasGameSection } from "@account/game/companionLocks"
import type { CompanionStatus } from "@account/game/companionStatus"
import {
    readGameSections,
    subscribeToGameSnapshots,
} from "@account/game/gameSync"
import { useSyncExternalStore } from "react"

// Whether the companion app, running now, fills a snapshot section (on a
// site server id and of a character, when given).
export const useCompanionFills = (
    status: CompanionStatus,
    section: string,
    server?: string,
    name?: string,
) => {
    const sections = useSyncExternalStore(
        subscribeToGameSnapshots,
        readGameSections,
    )

    return (
        status.state === "running" &&
        hasGameSection(sections, section, server, name)
    )
}
