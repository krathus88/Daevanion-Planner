import { Flex } from "@chakra-ui/react"
import { useDragOperation } from "@dnd-kit/react"
import type { TimerEntry } from "@timers/hooks/useTimers"
import { LayoutColumn } from "./LayoutColumn"
import { LayoutGap } from "./LayoutGap"

type LayoutBoardProps = {
    columns: TimerEntry[][]
    now: number
}

// Right to left like the header: gap 0 is the right edge.
export const LayoutBoard = ({ columns, now }: LayoutBoardProps) => {
    const { source } = useDragOperation()

    const isDragging = Boolean(source)

    return (
        <Flex py="2" minW="0" flex="1" flexDir="row-reverse" overflowX="auto">
            <LayoutGap index={0} isDragging={isDragging} />

            {columns.map((column, index) => (
                <Flex key={column[0].timer.id} flexDir="row-reverse">
                    <LayoutColumn
                        column={column}
                        now={now}
                        index={index}
                        draggedId={source?.id}
                    />

                    <LayoutGap index={index + 1} isDragging={isDragging} />
                </Flex>
            ))}
        </Flex>
    )
}
