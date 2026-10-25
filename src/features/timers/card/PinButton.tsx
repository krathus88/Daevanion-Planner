import { IconButton } from "@chakra-ui/react"
import type { TimerId } from "@timers/config/timers"
import { Tooltip } from "@ui/tooltip"
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

    const label = pinned ? `Unpin ${name}` : `Pin ${name} to the header`

    return (
        <Tooltip content={label} openDelay={100} showArrow>
            <IconButton
                variant={pinned ? "secondary" : "ghost"}
                size="xs"
                color={pinned ? "app.accent" : undefined}
                aria-label={label}
                aria-pressed={pinned}
                onClick={handleClick}
            >
                {pinned ? <LuPinOff /> : <LuPin />}
            </IconButton>
        </Tooltip>
    )
}
