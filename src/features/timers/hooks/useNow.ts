import { useSyncExternalStore } from "react"

// Timers end on whole seconds. Ticking a little after each one keeps a timer
// that fires a few ms early or late from showing a second twice and then
// skipping one.
const TICK_OFFSET = 50

// One clock for every timer on the page, ticking once a second.
let now = Date.now()
const listeners = new Set<() => void>()
let timeout: ReturnType<typeof setTimeout> | null = null

const tick = () => {
    now = Date.now()
    listeners.forEach((listener) => listener())
    timeout = setTimeout(tick, 1000 - ((now - TICK_OFFSET) % 1000))
}

const subscribe = (onChange: () => void) => {
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

const getSnapshot = () => {
    return now
}

export const useNow = () => {
    return useSyncExternalStore(subscribe, getSnapshot)
}
