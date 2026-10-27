import { readSyncStatus, subscribeToSyncStatus } from "@account/sync/cloudSync"
import { useSyncExternalStore } from "react"

export const useSyncStatus = () => {
    return useSyncExternalStore(subscribeToSyncStatus, readSyncStatus)
}
