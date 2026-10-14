import { chakra } from "@chakra-ui/react"
import type { TimerColor } from "@timers/config/timers"

type ColorSwatchButtonProps = {
    color: TimerColor
    selected: boolean
    onSelect: (color: TimerColor) => void
}

export const ColorSwatchButton = ({
    color,
    selected,
    onSelect,
}: ColorSwatchButtonProps) => {
    const handleClick = () => {
        onSelect(color)
    }

    // The same shades the timer highlight uses for each tone.
    const swatch =
        color.tone === "strong" ? "colorPalette.500" : "colorPalette.300"

    return (
        <chakra.button
            colorPalette={color.hue}
            boxSize="5"
            bg={swatch}
            borderColor={selected ? "app.bg" : "transparent"}
            borderRadius="full"
            borderWidth="2px"
            outlineColor={selected ? "app.fg" : "transparent"}
            outlineStyle="solid"
            outlineWidth="2px"
            cursor="button"
            _hover={selected ? undefined : { outlineColor: "app.muted" }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${color.hue}, ${color.tone}`}
            onClick={handleClick}
        />
    )
}
