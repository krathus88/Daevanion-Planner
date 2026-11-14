import { applySharedCorridorHolds } from "@account/game/gameSync"
import {
    readSharedCorridorHolds,
    subscribeToSharedCorridorHolds,
    type SharedCorridorHold,
} from "@tracker/shared/sharedCorridorHolds"
import type { TrackerData } from "@tracker/types"
import { useEffect, useSyncExternalStore } from "react"

const subscribeToNothing = () => {
    return () => {}
}

const NONE: readonly SharedCorridorHold[] = []

const readNothing = () => {
    return NONE
}

// Fills the tracker's corridor holdings from the ones every member shares,
// while the page is open and has characters. Again whenever the data
// changes, e.g. once the account's copy replaced this device's.
export const useSharedCorridorHolds = (data: TrackerData) => {
    const watching = data.characters.length > 0
    const holds = useSyncExternalStore(
        watching ? subscribeToSharedCorridorHolds : subscribeToNothing,
        watching ? readSharedCorridorHolds : readNothing,
    )

    useEffect(() => {
        if (holds.length > 0) {
            applySharedCorridorHolds(holds)
        }
    }, [holds, data])
}
