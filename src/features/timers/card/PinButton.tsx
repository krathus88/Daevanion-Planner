import { IconButton } from "@chakra-ui/react"
import type { TimerId } from "@timers/config/timers"
import { LuPin, LuPinOff } from "react-icons/lu"

type PinButtonProps = {
    id: TimerId
    pinned: boolean
    name: string
    onToggle: (id: TimerId) => void
}

export const PinButton = ({ id, pinned, name, onToggle }: PinButtonProps) => {
    const handleClick = () => {
        onToggle(id)
    }

    return (
        <IconButton
            variant={pinned ? "secondary" : "ghost"}
            size="xs"
            color={pinned ? "app.accent" : undefined}
            aria-label={pinned ? `Unpin ${name}` : `Pin ${name} to the header`}
            aria-pressed={pinned}
            onClick={handleClick}
        >
            {pinned ? <LuPinOff /> : <LuPin />}
        </IconButton>
    )
}
