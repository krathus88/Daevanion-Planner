import { IconButton } from "@chakra-ui/react"
import { HOVER_REVEAL } from "@common/hoverReveal"
import { Tooltip } from "@ui/tooltip"
import { LuEye, LuEyeOff } from "react-icons/lu"

type IgnoreToggleProps = {
    ignored: boolean
    label: string
    onChange: (ignored: boolean) => void
}

export const IgnoreToggle = ({
    ignored,
    label,
    onChange,
}: IgnoreToggleProps) => {
    const handleClick = () => {
        onChange(!ignored)
    }

    const action = ignored ? "Stop ignoring" : "Ignore"

    return (
        <Tooltip
            content={
                ignored
                    ? "Count this task again"
                    : "Skip this task for good; it stops counting"
            }
            openDelay={300}
        >
            <IconButton
                variant="ghost"
                size="2xs"
                pos="absolute"
                top="0"
                right="0"
                // Shown on hover where the device can hover; touch keeps it.
                _canHover={HOVER_REVEAL}
                color={ignored ? "app.fg" : "app.subtle"}
                aria-label={`${action}: ${label}`}
                aria-pressed={ignored}
                onClick={handleClick}
            >
                {ignored ? <LuEye /> : <LuEyeOff />}
            </IconButton>
        </Tooltip>
    )
}
