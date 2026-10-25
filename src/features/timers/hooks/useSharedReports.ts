import {
    readSharedReports,
    subscribeToSharedReports,
    type SharedReports,
} from "@timers/shared/sharedReports"
import { useSyncExternalStore } from "react"

const NO_REPORTS: SharedReports = {}

const subscribeToNothing = () => {
    return () => {}
}

const readNothing = () => {
    return NO_REPORTS
}

// `scopes`: the server and its Abyss pair. Null reads nothing.
export const useSharedReports = (scopes: string[] | null) => {
    const key = scopes?.join() ?? null

    const subscribe = (onChange: () => void) => {
        return key === null
            ? subscribeToNothing()
            : subscribeToSharedReports(key.split(","), onChange)
    }

    return useSyncExternalStore(
        subscribe,
        key === null ? readNothing : readSharedReports,
    )
}
