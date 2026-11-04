import { IconButton } from "@chakra-ui/react"
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
                size="xs"
                flexShrink="0"
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
