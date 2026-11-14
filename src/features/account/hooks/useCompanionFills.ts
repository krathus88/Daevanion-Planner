import { hasGameSection } from "@account/game/companionLocks"
import {
    readGameSections,
    subscribeToGameSnapshots,
} from "@account/game/gameSync"
import { useSyncExternalStore } from "react"

// Whether the companion app fills a snapshot section (on a site server id and
// of a character, when given): once it has sent one, running now or not.
export const useCompanionFills = (
    section: string,
    server?: string,
    name?: string,
) => {
    const sections = useSyncExternalStore(
        subscribeToGameSnapshots,
        readGameSections,
    )

    return hasGameSection(sections, section, server, name)
}

// Whether the companion app was ever used on this account: it has sent game
// data. What it fills stays locked from then on, running or not.
export const useCompanionUsed = () => {
    const sections = useSyncExternalStore(
        subscribeToGameSnapshots,
        readGameSections,
    )

    return sections !== ""
}
