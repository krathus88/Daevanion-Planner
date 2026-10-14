import type { TimerId } from "@timers/config/timers"

// The pinned timers as the header shows them: columns read from the right,
// each holding one timer or two stacked, so they never take more than two
// rows.
export type PinnedColumns = TimerId[][]

export const MAX_PER_COLUMN = 2

const columnOf = (columns: PinnedColumns, id: TimerId) => {
    return columns.findIndex((column) => column.includes(id))
}

export const isPinned = (columns: PinnedColumns, id: TimerId) => {
    return columnOf(columns, id) !== -1
}

// Takes the timer out, dropping its column if it was alone there.
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

// A newly pinned timer gets its own column at the far left.
export const addTimer = (columns: PinnedColumns, id: TimerId) => {
    if (isPinned(columns, id)) {
        return columns
    }

    return [...columns, [id]]
}

// Gives the timer its own column. Gap 0 is the right edge, gap N the left.
const moveToGap = (columns: PinnedColumns, id: TimerId, gap: number) => {
    const from = columnOf(columns, id)

    if (from === -1) {
        return columns
    }

    const wasAlone = columns[from].length === 1
    // Leaving its own column at the same spot changes nothing.
    if (wasAlone && (gap === from || gap === from + 1)) {
        return columns
    }

    const next = removeTimer(columns, id)
    // Removing a column to the right shifts the gaps after it by one.
    const at = wasAlone && from < gap ? gap - 1 : gap

    next.splice(at, 0, [id])

    return next
}

// Stacks the timer in a column that holds only one.
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

// Where a timer was dropped in the layout editor.
export type LayoutDrop =
    // Onto another timer: the two swap places.
    | { kind: "timer"; id: TimerId }
    // Onto the free spot under a lone timer: they stack.
    | { kind: "column"; index: number }
    // Between columns: it gets a column of its own.
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
