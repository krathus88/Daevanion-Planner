import { useDraggable, useDroppable } from "@dnd-kit/react"
import type { TimerEntry } from "@timers/hooks/useTimers"
import type { LayoutDrop } from "@timers/logic/pinnedColumns"
import { TimerChip } from "@timers/pinned/TimerChip"

type LayoutChipProps = {
    entry: TimerEntry
    now: number
}

// A pinned timer you can drag, and drop another onto to swap them.
export const LayoutChip = ({ entry, now }: LayoutChipProps) => {
    const { ref: dragRef, isDragging } = useDraggable({ id: entry.timer.id })
    const { ref: dropRef, isDropTarget } = useDroppable<LayoutDrop>({
        id: `timer-${entry.timer.id}`,
        data: { kind: "timer", id: entry.timer.id },
    })

    const setRef = (element: HTMLDivElement | null) => {
        dragRef(element)
        dropRef(element)
    }

    return (
        <TimerChip
            ref={setRef}
            entry={entry}
            now={now}
            draggable
            dropTarget={isDropTarget && !isDragging}
        />
    )
}
