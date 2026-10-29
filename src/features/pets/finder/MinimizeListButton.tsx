import { Icon, IconButton } from "@chakra-ui/react"
import { LuChevronUp, LuPanelLeftClose } from "react-icons/lu"

type MinimizeListButtonProps = {
    onClick: () => void
}

// Folds the list to the side on wide screens, or up when it sits above the map.
export const MinimizeListButton = ({ onClick }: MinimizeListButtonProps) => {
    return (
        <IconButton
            variant="ghost"
            size="2xs"
            aria-label="Minimize list"
            title="Minimize list"
            onClick={onClick}
        >
            <Icon boxSize="4" hideBelow="lg">
                <LuPanelLeftClose />
            </Icon>

            <Icon boxSize="4" hideFrom="lg">
                <LuChevronUp />
            </Icon>
        </IconButton>
    )
}
