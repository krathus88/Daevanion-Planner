import { Flex } from "@chakra-ui/react"
import { useDroppable } from "@dnd-kit/react"
import type { LayoutDrop } from "@timers/logic/pinnedColumns"

type LayoutSlotProps = {
    // The column it belongs to.
    index: number
}

// The free spot under a lone timer, shown while dragging.
export const LayoutSlot = ({ index }: LayoutSlotProps) => {
    const { ref, isDropTarget } = useDroppable<LayoutDrop>({
        id: `column-${index}`,
        data: { kind: "column", index: index },
    })

    return (
        <Flex
            ref={ref}
            h="6"
            bg={isDropTarget ? "app.accentMuted" : "transparent"}
            borderColor={isDropTarget ? "app.accent" : "app.borderStrong"}
            borderRadius="md"
            borderStyle="dashed"
            borderWidth="1px"
        />
    )
}
