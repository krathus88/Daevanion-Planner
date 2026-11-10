import {
    readNotmeterFeed,
    subscribeToNotmeterFeed,
    type NotmeterFeed,
} from "@timers/shared/notmeterFeed"
import { useSyncExternalStore } from "react"

const NO_FEED: NotmeterFeed = { reports: {}, error: null }

const subscribeToNothing = () => {
    return () => {}
}

const readNothing = () => {
    return NO_FEED
}

// Off reads nothing and doesn't fetch.
export const useNotmeterFeed = (enabled: boolean) => {
    return useSyncExternalStore(
        enabled ? subscribeToNotmeterFeed : subscribeToNothing,
        enabled ? readNotmeterFeed : readNothing,
    )
}
