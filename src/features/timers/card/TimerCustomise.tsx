import { Field, Flex, IconButton } from "@chakra-ui/react"
import { Section } from "@common/Section"
import type { TimerColor, TimerId } from "@timers/config/timers"
import { LuRotateCcw } from "react-icons/lu"
import { ColorSwatchPicker } from "./ColorSwatchPicker"
import { DurationInput } from "./DurationInput"

const MAX_SOON_MINUTES = 24 * 60

type TimerCustomiseProps = {
    id: TimerId
    color: TimerColor
    hasCustomColor: boolean
    soonMinutes: number
    onColorChange: (id: TimerId, color: TimerColor) => void
    onColorReset: (id: TimerId) => void
    onSoonMinutesChange: (id: TimerId, minutes: number) => void
}

export const TimerCustomise = ({
    id,
    color,
    hasCustomColor,
    soonMinutes,
    onColorChange,
    onColorReset,
    onSoonMinutesChange,
}: TimerCustomiseProps) => {
    const handleColorChange = (next: TimerColor) => {
        onColorChange(id, next)
    }

    const handleColorReset = () => {
        onColorReset(id)
    }

    const handleSoonMinutesChange = (minutes: number) => {
        onSoonMinutesChange(id, minutes)
    }

    return (
        <Section variant="sub" title="Customise">
            <Flex alignItems="center" gap="2">
                <ColorSwatchPicker value={color} onChange={handleColorChange} />

                {hasCustomColor && (
                    <IconButton
                        variant="ghost"
                        size="xs"
                        aria-label="Use default colour"
                        title="Use default colour"
                        onClick={handleColorReset}
                    >
                        <LuRotateCcw />
                    </IconButton>
                )}
            </Flex>

            <Field.Root
                orientation="horizontal"
                justifyContent="flex-start"
                gap="3"
            >
                <Field.Label fontSize="sm">Highlight when under</Field.Label>

                <DurationInput
                    value={soonMinutes}
                    max={MAX_SOON_MINUTES}
                    unit="min"
                    label="Minutes before it starts"
                    onChange={handleSoonMinutesChange}
                />
            </Field.Root>
        </Section>
    )
}
