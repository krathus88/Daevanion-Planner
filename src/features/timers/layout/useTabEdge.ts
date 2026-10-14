import { useEffect, useState, type RefObject } from "react"

// Which edge of the panel the tab sits on, if any. The corner under it is
// squared off so the two join; in the middle both corners stay round.
export type TabEdge = "left" | "middle" | "right"

// The heading row wraps on narrow screens, which moves the tab from the
// right edge to the middle or the left, so this follows it.
export const useTabEdge = (
    tabRef: RefObject<HTMLElement | null>,
    containerRef: RefObject<HTMLElement | null>,
) => {
    const [edge, setEdge] = useState<TabEdge>("right")

    useEffect(() => {
        const tab = tabRef.current
        const container = containerRef.current

        if (!tab || !container) {
            return
        }

        // Called once straight away when observing starts, then on resize.
        const observer = new ResizeObserver(() => {
            const tabBox = tab.getBoundingClientRect()
            const containerBox = container.getBoundingClientRect()

            if (Math.abs(tabBox.right - containerBox.right) < 1) {
                setEdge("right")
            } else if (Math.abs(tabBox.left - containerBox.left) < 1) {
                setEdge("left")
            } else {
                setEdge("middle")
            }
        })

        observer.observe(container)
        observer.observe(tab)

        return () => {
            observer.disconnect()
        }
    }, [tabRef, containerRef])

    return edge
}
