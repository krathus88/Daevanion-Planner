import { isRecord } from "@planner/storage/isRecord"

// Docked hangs from the header, `offset` px from the content's left edge.
// Free floats at viewport coordinates.
export type ComingNextPosition =
    { dock: "header"; offset: number } | { dock: "free"; x: number; y: number }

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
        return isNumber(value.offset)
    }

    return value.dock === "free" && isNumber(value.x) && isNumber(value.y)
}

const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), Math.max(min, max))
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
        return { dock: "header", offset: left - layout.contentLeft }
    }

    const bottom = layout.viewportHeight - layout.height
    const top = clamp(snapTo(y, [0, bottom]), 0, bottom)

    return { dock: "free", x: left, y: top }
}

// Keeps a saved position on screen after the window or strip resizes.
export const clampComingNext = (
    position: ComingNextPosition,
    layout: ComingNextLayout,
): ComingNextPosition => {
    const maxLeft = layout.viewportWidth - layout.width

    if (position.dock === "header") {
        const left = clamp(position.offset + layout.contentLeft, 0, maxLeft)

        return { dock: "header", offset: left - layout.contentLeft }
    }

    return {
        dock: "free",
        x: clamp(position.x, 0, maxLeft),
        y: clamp(position.y, 0, layout.viewportHeight - layout.height),
    }
}
