import { Flex } from "@chakra-ui/react"
import type { TimerEntry } from "@timers/hooks/useTimers"
import { MAX_PER_COLUMN } from "@timers/logic/pinnedColumns"
import { LayoutChip } from "./LayoutChip"
import { LayoutSlot } from "./LayoutSlot"

type LayoutColumnProps = {
    column: TimerEntry[]
    now: number
    index: number
    // The timer being dragged, if any.
    draggedId?: string | number
}

export const LayoutColumn = ({
    column,
    now,
    index,
    draggedId,
}: LayoutColumnProps) => {
    // A lone timer can take another under it, unless it's the one moving.
    const hasSlot =
        draggedId !== undefined &&
        column.length < MAX_PER_COLUMN &&
        column[0].timer.id !== draggedId

    return (
        <Flex flexShrink="0" flexDir="column" justifyContent="center" gap="0.5">
            {column.map((entry) => (
                <LayoutChip key={entry.timer.id} entry={entry} now={now} />
            ))}

            {hasSlot && <LayoutSlot index={index} />}
        </Flex>
    )
}
