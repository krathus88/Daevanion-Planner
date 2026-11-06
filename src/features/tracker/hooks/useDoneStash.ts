import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type PointerEvent,
    type RefObject,
} from "react"
import { prefersReducedMotion } from "./useSlideIntoPlace"

// How long done tasks fade out before they move; matches the taskLeave
// animation token.
export const DONE_LEAVE_MS = 200

// Done tasks move into a card's Done section only once the user leaves the
// card (the mouse leaves it, or a click or tap lands outside it), so a task
// doesn't jump away under the pointer. They fade out first (`leaving`), then
// move. One undone again comes back at once.
export const useDoneStash = (
    cardRef: RefObject<HTMLDivElement | null>,
    doneIds: readonly string[],
    // Runs right before the faded tasks move, e.g. to slide the rest.
    onBeforeMove?: () => void,
) => {
    const latestDone = useRef(doneIds)
    const [settled, setSettled] = useState(doneIds)
    const settledRef = useRef(settled)
    const [leaving, setLeaving] = useState<readonly string[]>([])
    const leaveTimer = useRef<number | undefined>(undefined)

    // A task undone forgets it was settled, so done again it waits for the
    // next leave like any other.
    if (settled.some((id) => !doneIds.includes(id))) {
        setSettled(settled.filter((id) => doneIds.includes(id)))
    }

    const settle = () => {
        // Tasks done meanwhile wait for the next leave.
        if (leaveTimer.current !== undefined) {
            return
        }

        const done = latestDone.current
        const moving = done.filter((id) => !settledRef.current.includes(id))

        if (moving.length === 0) {
            if (done.length !== settledRef.current.length) {
                setSettled(done)
            }

            return
        }

        if (prefersReducedMotion()) {
            setSettled(done)

            return
        }

        setLeaving(moving)
        leaveTimer.current = window.setTimeout(() => {
            leaveTimer.current = undefined
            latestBeforeMove.current?.()
            setLeaving([])
            setSettled(done)
        }, DONE_LEAVE_MS)
    }

    const latestSettle = useRef(settle)
    const latestBeforeMove = useRef(onBeforeMove)

    useLayoutEffect(() => {
        latestDone.current = doneIds
        settledRef.current = settled
        latestSettle.current = settle
        latestBeforeMove.current = onBeforeMove
    })

    useEffect(() => {
        // On click, not pointerdown: the click has already found its target,
        // so the card shrinking can't move what the user is clicking.
        const handleClick = (event: MouseEvent) => {
            const card = cardRef.current

            if (card && !card.contains(event.target as Node)) {
                latestSettle.current()
            }
        }

        document.addEventListener("click", handleClick, true)

        return () => {
            document.removeEventListener("click", handleClick, true)
        }
    }, [cardRef])

    useEffect(() => {
        return () => {
            window.clearTimeout(leaveTimer.current)
        }
    }, [])

    // Touch fires a leave after every tap, so only a mouse settles here.
    const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "mouse") {
            settle()
        }
    }

    return {
        stashed: settled.filter((id) => doneIds.includes(id)),
        // Done tasks fading out on their way to the Done section.
        leaving: leaving.filter((id) => doneIds.includes(id)),
        onPointerLeave: handlePointerLeave,
    }
}
