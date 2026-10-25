import { readAuth, subscribeToAuth } from "@timers/shared/auth"
import { useSyncExternalStore } from "react"

export const useAuth = () => {
    return useSyncExternalStore(subscribeToAuth, readAuth)
}
