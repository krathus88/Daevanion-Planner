import { Flex } from "@chakra-ui/react"
import { TIMER_HUES, TIMER_TONES, type TimerColor } from "@timers/config/timers"
import { ColorSwatchButton } from "./ColorSwatchButton"

type ColorSwatchPickerProps = {
    value: TimerColor
    onChange: (color: TimerColor) => void
}

export const ColorSwatchPicker = ({
    value,
    onChange,
}: ColorSwatchPickerProps) => {
    return (
        // Room for the selected outline, which the collapsible would clip.
        <Flex
            p="0.5"
            flexDir="column"
            gap="1.5"
            role="radiogroup"
            aria-label="Colour"
        >
            {TIMER_TONES.map((tone) => (
                <Flex key={tone} flexWrap="wrap" gap="1.5">
                    {TIMER_HUES.map((hue) => (
                        <ColorSwatchButton
                            key={hue}
                            color={{ hue: hue, tone: tone }}
                            selected={hue === value.hue && tone === value.tone}
                            onSelect={onChange}
                        />
                    ))}
                </Flex>
            ))}
        </Flex>
    )
}
