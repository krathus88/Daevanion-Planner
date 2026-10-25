import type { TimerId } from "@timers/config/timers"

// Columns read from the right, each with one or two stacked timers.
export type PinnedColumns = TimerId[][]

export const MAX_PER_COLUMN = 2

const columnOf = (columns: PinnedColumns, id: TimerId) => {
    return columns.findIndex((column) => column.includes(id))
}

export const isPinned = (columns: PinnedColumns, id: TimerId) => {
    return columnOf(columns, id) !== -1
}

export const removeTimer = (columns: PinnedColumns, id: TimerId) => {
    const next: PinnedColumns = []

    for (const column of columns) {
        const rest = column.filter((timer) => timer !== id)

        if (rest.length > 0) {
            next.push(rest)
        }
    }

    return next
}

export const addTimer = (columns: PinnedColumns, id: TimerId) => {
    if (isPinned(columns, id)) {
        return columns
    }

    // Only the newest column takes it; older gaps the user left stay as they are.
    const newest = columns.length - 1

    if (newest === -1 || columns[newest].length >= MAX_PER_COLUMN) {
        return [...columns, [id]]
    }

    return columns.map((column, index) =>
        index === newest ? [...column, id] : column,
    )
}

// Gap 0 is the right edge.
const moveToGap = (columns: PinnedColumns, id: TimerId, gap: number) => {
    const from = columnOf(columns, id)

    if (from === -1) {
        return columns
    }

    const wasAlone = columns[from].length === 1
    if (wasAlone && (gap === from || gap === from + 1)) {
        return columns
    }

    const next = removeTimer(columns, id)
    // Removing a column to the right shifts the gaps after it by one.
    const at = wasAlone && from < gap ? gap - 1 : gap

    next.splice(at, 0, [id])

    return next
}

const moveToColumn = (columns: PinnedColumns, id: TimerId, target: number) => {
    const from = columnOf(columns, id)

    if (
        from === -1 ||
        from === target ||
        columns[target].length >= MAX_PER_COLUMN
    ) {
        return columns
    }

    const targetId = columns[target][0]
    const next = removeTimer(columns, id)

    next[columnOf(next, targetId)].push(id)

    return next
}

const swapTimers = (
    columns: PinnedColumns,
    first: TimerId,
    second: TimerId,
) => {
    return columns.map((column) =>
        column.map((timer) => {
            if (timer === first) {
                return second
            }

            return timer === second ? first : timer
        }),
    )
}

export type LayoutDrop =
    | { kind: "timer"; id: TimerId }
    | { kind: "column"; index: number }
    | { kind: "gap"; index: number }

export const applyDrop = (
    columns: PinnedColumns,
    id: TimerId,
    drop: LayoutDrop,
) => {
    if (drop.kind === "timer") {
        return swapTimers(columns, id, drop.id)
    }

    if (drop.kind === "column") {
        return moveToColumn(columns, id, drop.index)
    }

    return moveToGap(columns, id, drop.index)
}
