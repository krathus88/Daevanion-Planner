import { Flex, IconButton } from "@chakra-ui/react"
import { LuArrowDown, LuArrowUp } from "react-icons/lu"

type MoveButtonsProps = {
    first: boolean
    last: boolean
    label: string
    onMove: (offset: -1 | 1) => void
}

// Up and down arrows for reordering a list item.
export const MoveButtons = ({
    first,
    last,
    label,
    onMove,
}: MoveButtonsProps) => {
    const handleUp = () => {
        onMove(-1)
    }

    const handleDown = () => {
        onMove(1)
    }

    return (
        <Flex flexShrink="0" gap="0.5">
            <IconButton
                variant="ghost"
                size="xs"
                disabled={first}
                aria-label={`Move ${label} up`}
                onClick={handleUp}
            >
                <LuArrowUp />
            </IconButton>

            <IconButton
                variant="ghost"
                size="xs"
                disabled={last}
                aria-label={`Move ${label} down`}
                onClick={handleDown}
            >
                <LuArrowDown />
            </IconButton>
        </Flex>
    )
}
