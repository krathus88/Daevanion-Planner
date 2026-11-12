import {
    readCompanionStatusNow,
    subscribeToCompanionStatus,
} from "@account/game/companionStatus"
import { useSyncExternalStore } from "react"

// Whether the companion app is running, and which character it sees.
export const useCompanionStatus = () => {
    return useSyncExternalStore(
        subscribeToCompanionStatus,
        readCompanionStatusNow,
    )
}
