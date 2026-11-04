import { Button } from "@chakra-ui/react"
import { LuChevronDown, LuChevronUp } from "react-icons/lu"
import { revealOnStripHover } from "./hoverReveal"

const reveal = revealOnStripHover({ side: "end", maxW: "8", px: "2" })

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
            // Collapsed, the toggle is all there is, so it stays.
            css={open ? reveal : undefined}
            aria-controls={open ? "coming-next-list" : undefined}
            aria-expanded={open}
            title={label}
            data-folds={open ? "end" : undefined}
            onClick={onToggle}
        >
            {open ? <LuChevronUp /> : "Coming next"}

            {!open && <LuChevronDown />}
        </Button>
    )
}
