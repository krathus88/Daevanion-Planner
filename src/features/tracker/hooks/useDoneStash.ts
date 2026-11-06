import {
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
    type PointerEvent,
    type RefObject,
} from "react"

// Done tasks move into a card's Done section only once the user leaves the
// card (the mouse leaves it, or a click or tap lands outside it), so a task
// doesn't jump away under the pointer. One undone again comes back at once.
export const useDoneStash = (
    cardRef: RefObject<HTMLDivElement | null>,
    doneIds: readonly string[],
) => {
    const latestDone = useRef(doneIds)
    const [settled, setSettled] = useState(doneIds)

    useLayoutEffect(() => {
        latestDone.current = doneIds
    })

    useEffect(() => {
        // On click, not pointerdown: the click has already found its target,
        // so the card shrinking can't move what the user is clicking.
        const handleClick = (event: MouseEvent) => {
            const card = cardRef.current

            if (card && !card.contains(event.target as Node)) {
                setSettled(latestDone.current)
            }
        }

        document.addEventListener("click", handleClick, true)

        return () => {
            document.removeEventListener("click", handleClick, true)
        }
    }, [cardRef])

    // Touch fires a leave after every tap, so only a mouse settles here.
    const handlePointerLeave = (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === "mouse") {
            setSettled(latestDone.current)
        }
    }

    return {
        stashed: settled.filter((id) => doneIds.includes(id)),
        onPointerLeave: handlePointerLeave,
    }
}
