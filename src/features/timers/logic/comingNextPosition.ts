import { isRecord } from "@planner/storage/isRecord"

// Stored as fractions of the room the strip can move in (0 = left/top,
// 1 = right/bottom), so it keeps its place when the window resizes.
// Docked hangs from the header, `along` the content width.
// Free floats `fx`/`fy` across the viewport.
export type ComingNextPosition =
    { dock: "header"; along: number } | { dock: "free"; fx: number; fy: number }

// Everything measured in viewport px.
export type ComingNextLayout = {
    viewportWidth: number
    viewportHeight: number
    headerBottom: number
    contentLeft: number
    contentRight: number
    width: number
    height: number
}

const SNAP_DISTANCE = 16

const isNumber = (value: unknown): value is number => {
    return typeof value === "number" && Number.isFinite(value)
}

export const isComingNextPosition = (
    value: unknown,
): value is ComingNextPosition => {
    if (!isRecord(value)) {
        return false
    }

    if (value.dock === "header") {
        return isNumber(value.along)
    }

    return value.dock === "free" && isNumber(value.fx) && isNumber(value.fy)
}

const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), Math.max(min, max))
}

// `value` as a fraction of `range`, and back.
const toFraction = (value: number, range: number) => {
    return range > 0 ? value / range : 0
}

const fromFraction = (fraction: number, range: number) => {
    return fraction * Math.max(range, 0)
}

const getHeaderRange = (layout: ComingNextLayout) => {
    return layout.contentRight - layout.contentLeft - layout.width
}

// The closest edge within reach, or the value unchanged.
const snapTo = (value: number, edges: number[]) => {
    let best = value
    let bestDistance = SNAP_DISTANCE

    for (const edge of edges) {
        const distance = Math.abs(value - edge)

        if (distance <= bestDistance) {
            best = edge
            bestDistance = distance
        }
    }

    return best
}

// Where a strip dropped with its top-left corner at (x, y) settles.
export const snapComingNext = (
    x: number,
    y: number,
    layout: ComingNextLayout,
): ComingNextPosition => {
    const rightEdges = [layout.contentRight, layout.viewportWidth]
    const snappedLeft = snapTo(x, [0, layout.contentLeft])
    const snappedRight = snapTo(x + layout.width, rightEdges) - layout.width
    const snappedX = snappedLeft !== x ? snappedLeft : snappedRight
    const left = clamp(snappedX, 0, layout.viewportWidth - layout.width)

    if (Math.abs(y - layout.headerBottom) <= SNAP_DISTANCE) {
        return {
            dock: "header",
            along: toFraction(
                left - layout.contentLeft,
                getHeaderRange(layout),
            ),
        }
    }

    const bottom = layout.viewportHeight - layout.height
    const top = clamp(snapTo(y, [0, bottom]), 0, bottom)

    return {
        dock: "free",
        fx: toFraction(left, layout.viewportWidth - layout.width),
        fy: toFraction(top, bottom),
    }
}

// The strip's top-left corner in viewport px for the current window, kept
// on screen.
export const placeComingNext = (
    position: ComingNextPosition,
    layout: ComingNextLayout,
) => {
    const maxLeft = layout.viewportWidth - layout.width
    const maxTop = layout.viewportHeight - layout.height

    if (position.dock === "header") {
        const offset = fromFraction(position.along, getHeaderRange(layout))

        return {
            x: clamp(layout.contentLeft + offset, 0, maxLeft),
            y: layout.headerBottom,
        }
    }

    return {
        x: clamp(fromFraction(position.fx, maxLeft), 0, maxLeft),
        y: clamp(fromFraction(position.fy, maxTop), 0, maxTop),
    }
}
