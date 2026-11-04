import {
    placeComingNext,
    snapComingNext,
    type ComingNextLayout,
    type ComingNextPosition,
} from "@timers/logic/comingNextPosition"
import { useLayoutEffect, useRef, useState, type PointerEvent } from "react"

type Point = { x: number; y: number }

const DEFAULT_POSITION: ComingNextPosition = { dock: "header", along: 0 }

const readPx = (value: string) => {
    return Number.parseFloat(value) || 0
}

// How far the strip's control marked `data-folds` at that end has grown out
// of it: its width and margins plus the gap beside it (0 while folded).
const getGrowth = (strip: HTMLElement, side: "start" | "end") => {
    const control = strip.querySelector<HTMLElement>(
        `:scope > [data-folds="${side}"]`,
    )

    if (!control) {
        return 0
    }

    const style = getComputedStyle(control)
    const gap = readPx(getComputedStyle(strip).columnGap)

    return (
        control.getBoundingClientRect().width +
        readPx(style.marginLeft) +
        readPx(style.marginRight) +
        gap
    )
}

// `anchorRef` sits at the header's bottom edge and spans the content width.
// Positions are the strip's `left`; its margin slides it further while the
// handle is unfolded, so they leave that out.
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

        let width = 0

        const measure = () => {
            const anchorRect = anchor.getBoundingClientRect()
            const startGrowth = getGrowth(strip, "start")
            const endGrowth = getGrowth(strip, "end")
            const folded =
                strip.getBoundingClientRect().width - startGrowth - endGrowth

            // While the controls unfold, the parts don't add up to exactly
            // the same folded width every frame; following that noise would
            // make the timers wobble, so only a real change counts.
            if (Math.abs(folded - width) >= 1) {
                width = folded
            }

            setLayout({
                viewportWidth: document.documentElement.clientWidth,
                viewportHeight: window.innerHeight,
                headerBottom: header.getBoundingClientRect().bottom,
                contentLeft: anchorRect.left,
                contentRight: anchorRect.right,
                width: width,
                startGrowth: startGrowth,
                endGrowth: endGrowth,
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
        const left = rect.left - readPx(getComputedStyle(strip).marginLeft)

        grabRef.current = {
            x: event.clientX - left,
            y: event.clientY - rect.top,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        setDrag({ x: left, y: rect.top })
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

    const placed = layout
        ? placeComingNext(position ?? DEFAULT_POSITION, layout)
        : null
    // A whole-pixel left keeps the text crisp while the strip slides.
    const topLeft =
        drag ?? (placed ? { x: Math.round(placed.x), y: placed.y } : null)
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
