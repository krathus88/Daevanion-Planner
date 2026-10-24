import { useEffect, useState, type RefObject } from "react"

export type TabEdge = "left" | "middle" | "right"

// The heading row wraps on narrow screens, moving the tab.
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
