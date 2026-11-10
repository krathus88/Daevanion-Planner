import { getNow, subscribeToNow } from "@timers/hooks/useNow"
import { getResetPeriods, type ResetPeriods } from "@tracker/logic/resetPeriods"
import { useSyncExternalStore } from "react"

let cached: ResetPeriods | null = null

// The same object until a reset starts a new period.
const getPeriods = () => {
    const next = getResetPeriods(getNow())

    if (
        !cached ||
        cached.energy !== next.energy ||
        cached.daily !== next.daily ||
        cached.weekly !== next.weekly ||
        cached.siege !== next.siege
    ) {
        cached = next
    }

    return cached
}

// The current reset periods. Unlike useNow, it changes only at a reset (the
// energy one every 3 hours), so the cards (which read every count by period)
// don't re-render each second.
export const useResetPeriods = () => {
    return useSyncExternalStore(subscribeToNow, getPeriods)
}
