import { useSyncExternalStore } from "react"

// Ticks just after each second so a timer a few ms off doesn't repeat or
// skip a second.
const TICK_OFFSET = 50

let now = Date.now()
const listeners = new Set<() => void>()
let timeout: ReturnType<typeof setTimeout> | null = null

const tick = () => {
    now = Date.now()
    listeners.forEach((listener) => listener())
    timeout = setTimeout(tick, 1000 - ((now - TICK_OFFSET) % 1000))
}

// Exported for stores that derive a value from the clock and only change
// when it does (see the tracker's useResetPeriods).
export const subscribeToNow = (onChange: () => void) => {
    listeners.add(onChange)

    if (!timeout) {
        tick()
    }

    return () => {
        listeners.delete(onChange)

        if (listeners.size === 0 && timeout) {
            clearTimeout(timeout)
            timeout = null
        }
    }
}

export const getNow = () => {
    return now
}

export const useNow = () => {
    return useSyncExternalStore(subscribeToNow, getNow)
}
