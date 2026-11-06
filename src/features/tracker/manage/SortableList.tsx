import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react"
import { isSortable } from "@dnd-kit/react/sortable"
import type { ReactNode } from "react"

type SortableListProps = {
    // The rows' ids in their saved order.
    ids: string[]
    children: ReactNode
    onMove: (id: string, targetId: string) => void
}

// Rows (SortableRow) reorder by dragging their handle; a drop moves the row to
// where the row it landed on was.
export const SortableList = ({ ids, children, onMove }: SortableListProps) => {
    const handleDragEnd = (event: DragEndEvent) => {
        const source = event.operation.source

        if (event.canceled || !isSortable(source)) {
            return
        }

        const targetId = ids[source.index]

        if (source.index !== source.initialIndex && targetId !== undefined) {
            onMove(String(source.id), targetId)
        }
    }

    return (
        <DragDropProvider onDragEnd={handleDragEnd}>
            {children}
        </DragDropProvider>
    )
}
