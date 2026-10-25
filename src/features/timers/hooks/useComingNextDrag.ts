import {
    placeComingNext,
    snapComingNext,
    type ComingNextLayout,
    type ComingNextPosition,
} from "@timers/logic/comingNextPosition"
import { useLayoutEffect, useRef, useState, type PointerEvent } from "react"

type Point = { x: number; y: number }

const DEFAULT_POSITION: ComingNextPosition = { dock: "header", along: 0 }

// `anchorRef` sits at the header's bottom edge and spans the content width.
export const useComingNextDrag = (
    position: ComingNextPosition | null,
    onDrop: (position: ComingNextPosition) => void,
) => {
    const [layout, setLayout] = useState<ComingNextLayout | null>(null)
    const [drag, setDrag] = useState<Point | null>(null)
    const anchorRef = useRef<HTMLDivElement>(null)
    const stripRef = useRef<HTMLDivElement>(null)
    const grabRef = useRef<Point | null>(null)

    useLayoutEffect(() => {
        const anchor = anchorRef.current
        const strip = stripRef.current
        const header = anchor?.closest("header")

        if (!anchor || !strip || !header) {
            return
        }

        const measure = () => {
            const anchorRect = anchor.getBoundingClientRect()
            setLayout({
                viewportWidth: document.documentElement.clientWidth,
                viewportHeight: window.innerHeight,
                headerBottom: header.getBoundingClientRect().bottom,
                contentLeft: anchorRect.left,
                contentRight: anchorRect.right,
                width: strip.offsetWidth,
                height: strip.offsetHeight,
            })
        }

        measure()

        // The root resizes when a scrollbar appears, without a window resize.
        const observer = new ResizeObserver(measure)
        observer.observe(document.documentElement)
        observer.observe(header)
        observer.observe(anchor)
        observer.observe(strip)
        window.addEventListener("resize", measure)

        return () => {
            observer.disconnect()
            window.removeEventListener("resize", measure)
        }
    }, [])

    const handlePointerDown = (event: PointerEvent<HTMLElement>) => {
        const strip = stripRef.current

        if (!strip || event.button !== 0) {
            return
        }

        const rect = strip.getBoundingClientRect()

        grabRef.current = {
            x: event.clientX - rect.left,
            y: event.clientY - rect.top,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        setDrag({ x: rect.left, y: rect.top })
    }

    const handlePointerMove = (event: PointerEvent<HTMLElement>) => {
        const grab = grabRef.current

        if (!grab) {
            return
        }

        setDrag({ x: event.clientX - grab.x, y: event.clientY - grab.y })
    }

    const handlePointerUp = (event: PointerEvent<HTMLElement>) => {
        const grab = grabRef.current

        if (!grab) {
            return
        }

        grabRef.current = null
        setDrag(null)

        if (layout) {
            onDrop(
                snapComingNext(
                    event.clientX - grab.x,
                    event.clientY - grab.y,
                    layout,
                ),
            )
        }
    }

    const topLeft =
        drag ??
        (layout ? placeComingNext(position ?? DEFAULT_POSITION, layout) : null)
    const isDocked =
        drag === null && (position === null || position.dock === "header")

    return {
        anchorRef: anchorRef,
        stripRef: stripRef,
        topLeft: topLeft,
        isDragging: drag !== null,
        isDocked: isDocked,
        handlePointerDown: handlePointerDown,
        handlePointerMove: handlePointerMove,
        handlePointerUp: handlePointerUp,
    }
}
