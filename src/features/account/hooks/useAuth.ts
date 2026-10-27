import { readAuth, subscribeToAuth } from "@account/auth"
import { useSyncExternalStore } from "react"

export const useAuth = () => {
    return useSyncExternalStore(subscribeToAuth, readAuth)
}
