import { DragDropProvider, type DragEndEvent } from "@dnd-kit/react"
import { isTimerId } from "@timers/config/timers"
import type { TimerEntry } from "@timers/hooks/useTimers"
import {
    applyDrop,
    type LayoutDrop,
    type PinnedColumns,
} from "@timers/logic/pinnedColumns"
import { LayoutBoard } from "./LayoutBoard"

type PinnedLayoutBoardProps = {
    columns: TimerEntry[][]
    now: number
    onChange: (columns: PinnedColumns) => void
}

export const PinnedLayoutBoard = ({
    columns,
    now,
    onChange,
}: PinnedLayoutBoardProps) => {
    const handleDragEnd = (event: DragEndEvent) => {
        const id = event.operation.source?.id
        const drop = event.operation.target?.data as LayoutDrop | undefined

        if (event.canceled || !isTimerId(id) || !drop) {
            return
        }

        onChange(applyDrop(ids, id, drop))
    }

    const ids = columns.map((column) => column.map((entry) => entry.timer.id))

    return (
        <DragDropProvider onDragEnd={handleDragEnd}>
            <LayoutBoard columns={columns} now={now} />
        </DragDropProvider>
    )
}
