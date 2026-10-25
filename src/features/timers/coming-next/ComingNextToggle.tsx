import { Button } from "@chakra-ui/react"
import { LuChevronDown, LuChevronUp } from "react-icons/lu"

type ComingNextToggleProps = {
    open: boolean
    onToggle: () => void
}

export const ComingNextToggle = ({ open, onToggle }: ComingNextToggleProps) => {
    const label = open ? "Hide coming next" : "Show coming next"

    return (
        <Button
            variant="ghost"
            size="2xs"
            px="2"
            flexShrink="0"
            fontSize="xs"
            aria-controls={open ? "coming-next-list" : undefined}
            aria-expanded={open}
            title={label}
            onClick={onToggle}
        >
            {open ? <LuChevronUp /> : "Coming next"}

            {!open && <LuChevronDown />}
        </Button>
    )
}
