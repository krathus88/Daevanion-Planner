import { useEffect, useRef, useSyncExternalStore } from "react"
import type { HighlightedStat } from "@planner/logic/statCells"

// A name must be hovered this long before the board highlights its nodes, so
// passing over the list doesn't flash the board. Every name waits anew.
export const HIGHLIGHT_DELAY_MS = 750

let highlighted: HighlightedStat | null = null
const listeners = new Set<() => void>()

const setHighlighted = (stat: HighlightedStat | null) => {
    if (highlighted === stat) {
        return
    }

    highlighted = stat
    for (const listener of listeners) {
        listener()
    }
}

const subscribe = (listener: () => void) => {
    listeners.add(listener)
    return () => {
        listeners.delete(listener)
    }
}

const getHighlighted = () => {
    return highlighted
}

// The stat whose nodes the board highlights. A store of its own, so a hover
// re-renders only the board, not the whole page.
export const useHighlightedStat = () => {
    return useSyncExternalStore(subscribe, getHighlighted, getHighlighted)
}

// Hover (or focus) handlers for a stat's name: after HIGHLIGHT_DELAY_MS the
// board highlights its nodes, until the name is left. Clears it on unmount
// when it's still this stat's. Null (a row with nothing to show) does nothing.
export const useStatHighlight = (stat: HighlightedStat | null) => {
    const isOwner = useRef(false)
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

    useEffect(() => {
        return () => {
            if (timer.current !== null) {
                clearTimeout(timer.current)
            }

            if (isOwner.current && highlighted === stat) {
                setHighlighted(null)
            }
        }
    }, [stat])

    const cancelTimer = () => {
        if (timer.current !== null) {
            clearTimeout(timer.current)
            timer.current = null
        }
    }

    const show = () => {
        if (stat === null) {
            return
        }

        isOwner.current = true
        cancelTimer()
        timer.current = setTimeout(() => {
            timer.current = null
            setHighlighted(stat)
        }, HIGHLIGHT_DELAY_MS)
    }

    const hide = () => {
        isOwner.current = false
        cancelTimer()
        if (stat !== null && highlighted === stat) {
            setHighlighted(null)
        }
    }

    return { show: show, hide: hide }
}
