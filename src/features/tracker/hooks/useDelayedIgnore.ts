import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { DONE_LEAVE_MS } from "./useDoneStash"
import { prefersReducedMotion } from "./useSlideIntoPlace"

// Ignoring a task fades it out first (`ignoring`), like a done task on its
// way to the Done section, then hands it to `onIgnore`. Right away when the
// user prefers reduced motion. `onBeforeMove` runs right before the move.
export const useDelayedIgnore = (
    onIgnore: (taskId: string) => void,
    onBeforeMove: () => void,
) => {
    const [ignoring, setIgnoring] = useState<readonly string[]>([])
    const timers = useRef(new Map<string, number>())
    const latest = useRef({ onIgnore, onBeforeMove })

    useLayoutEffect(() => {
        latest.current = { onIgnore, onBeforeMove }
    })

    const move = (taskId: string) => {
        timers.current.delete(taskId)
        latest.current.onBeforeMove()
        setIgnoring((current) => current.filter((id) => id !== taskId))
        latest.current.onIgnore(taskId)
    }

    const ignore = (taskId: string) => {
        if (timers.current.has(taskId)) {
            return
        }

        if (prefersReducedMotion()) {
            move(taskId)

            return
        }

        setIgnoring((current) => [...current, taskId])
        timers.current.set(
            taskId,
            window.setTimeout(() => move(taskId), DONE_LEAVE_MS),
        )
    }

    // Gone mid-fade (the card minimized or removed): ignore at once.
    useEffect(() => {
        const pending = timers.current

        return () => {
            for (const [taskId, timer] of pending) {
                window.clearTimeout(timer)
                latest.current.onIgnore(taskId)
            }

            pending.clear()
        }
    }, [])

    return { ignoring: ignoring, ignore: ignore }
}
