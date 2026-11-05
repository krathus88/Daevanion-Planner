import { Flex } from "@chakra-ui/react"
import { useDroppable } from "@dnd-kit/react"
import type { StatDrop } from "@planner/logic/statListEdits"

type StatRankGapProps = {
    // The new rank goes before rank `index`.
    index: number
    isDragging: boolean
}

// Dropping here makes a new rank. Its height never changes, so starting a
// drag doesn't shift the list; the line only shows while dragging.
export const StatRankGap = ({ index, isDragging }: StatRankGapProps) => {
    const { ref, isDropTarget } = useDroppable<StatDrop>({
        id: `gap-${index}`,
        data: { kind: "gap", index: index },
    })

    return (
        <Flex ref={ref} h="4" alignItems="center">
            {isDragging && (
                <Flex
                    h="0.5"
                    flex="1"
                    bg={isDropTarget ? "app.accent" : "app.borderStrong"}
                    borderRadius="full"
                />
            )}
        </Flex>
    )
}
