import { IconButton } from "@chakra-ui/react"
import { useTimerSettings } from "@timers/hooks/useTimerSettings"
import { LuEye, LuEyeOff } from "react-icons/lu"

// Hides or shows the pinned timers. Always in the same spot, beside the class
// picker, so it doesn't move when the timers come and go. With a mouse it only
// shows while the header is hovered; touch screens always show it.
export const PinnedToggleButton = () => {
    const { settings, changeShowPinned } = useTimerSettings()

    const handleToggle = () => {
        changeShowPinned(!settings.showPinned)
    }

    const label = settings.showPinned
        ? "Hide pinned timers"
        : "Show pinned timers"

    if (settings.pinned.length === 0) {
        return null
    }

    return (
        <IconButton
            variant="ghost"
            size="xs"
            flexShrink="0"
            _canHover={{
                opacity: "hidden",
                _groupHover: { opacity: "visible" },
                _focusVisible: { opacity: "visible" },
            }}
            aria-label={label}
            aria-pressed={settings.showPinned}
            title={label}
            onClick={handleToggle}
        >
            {settings.showPinned ? <LuEyeOff /> : <LuEye />}
        </IconButton>
    )
}
