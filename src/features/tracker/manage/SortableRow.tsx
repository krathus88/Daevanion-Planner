import { Flex, Icon } from "@chakra-ui/react"
import { useSortable } from "@dnd-kit/react/sortable"
import type { ReactNode } from "react"
import { LuGripVertical } from "react-icons/lu"

type SortableRowProps = {
    id: string
    index: number
    // Names the drag handle.
    label: string
    children: ReactNode
}

// A row of a SortableList, dragged by the grip at its start.
export const SortableRow = ({
    id,
    index,
    label,
    children,
}: SortableRowProps) => {
    const { ref, handleRef, isDragging } = useSortable({ id: id, index: index })

    return (
        <Flex
            ref={ref}
            // For controls inside that show on hover.
            className="group"
            flexWrap="wrap"
            alignItems="center"
            gap="2"
            opacity={isDragging ? "dimmed" : undefined}
        >
            <Flex
                ref={handleRef}
                flexShrink="0"
                color="app.subtle"
                cursor="grab"
                _hover={{ color: "app.fg" }}
                role="button"
                tabIndex={0}
                aria-label={`Drag ${label}`}
            >
                <Icon as={LuGripVertical} boxSize="4" />
            </Flex>

            {children}
        </Flex>
    )
}
