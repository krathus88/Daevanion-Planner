import { Flex } from "@chakra-ui/react"
import { useDroppable } from "@dnd-kit/react"
import type { LayoutDrop } from "@timers/logic/pinnedColumns"

type LayoutGapProps = {
    // 0 is the right edge.
    index: number
    isDragging: boolean
}

// Space between columns. Dropping here gives the timer its own column.
export const LayoutGap = ({ index, isDragging }: LayoutGapProps) => {
    const { ref, isDropTarget } = useDroppable<LayoutDrop>({
        id: `gap-${index}`,
        data: { kind: "gap", index: index },
    })

    return (
        <Flex
            ref={ref}
            w={isDragging ? "4" : "1"}
            flexShrink="0"
            alignSelf="stretch"
            justifyContent="center"
        >
            {isDragging && (
                <Flex
                    w="1"
                    bg={isDropTarget ? "app.accent" : "app.border"}
                    borderRadius="full"
                />
            )}
        </Flex>
    )
}
