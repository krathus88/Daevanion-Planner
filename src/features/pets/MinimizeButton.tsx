import { Icon, IconButton } from "@chakra-ui/react"
import { LuChevronUp } from "react-icons/lu"

type MinimizeButtonProps = {
    onClick: () => void
}

export const MinimizeButton = ({ onClick }: MinimizeButtonProps) => {
    return (
        <IconButton
            variant="ghost"
            size="sm"
            aria-label="Minimize"
            title="Minimize"
            onClick={onClick}
        >
            <Icon boxSize="4">
                <LuChevronUp />
            </Icon>
        </IconButton>
    )
}
