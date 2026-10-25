import { Flex, SegmentGroup, Text } from "@chakra-ui/react"
import { LEVEL_COLORS, PET_LEVELS } from "@pets/logic/petLevels"

// Each level's label in its own color, so the picker matches the badges.
const items = [
    { value: "0", label: "Locked" },
    ...PET_LEVELS.map((level) => ({
        value: String(level),
        label: (
            <Text as="span" color={LEVEL_COLORS[level].fg}>
                Lv{level}
            </Text>
        ),
    })),
]

type LevelPickerProps = {
    // 0 is locked; 1-3 are Pet Insight levels.
    value: number
    onChange: (value: number) => void
}

export const LevelPicker = ({ value, onChange }: LevelPickerProps) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        onChange(Number(details.value))
    }

    // The selected thumb takes the level's tint; Locked keeps the default.
    const indicatorBg =
        value > 0 ? `colors.${LEVEL_COLORS[value].bg}` : "colors.app.raised"

    return (
        <Flex flexDir="column" alignItems="flex-end" gap="1">
            <Text textStyle="label">Your Insight level</Text>

            <SegmentGroup.Root
                size="xs"
                value={String(value)}
                css={{ "--segment-indicator-bg": indicatorBg }}
                aria-label="Your Insight level"
                onValueChange={handleValueChange}
            >
                <SegmentGroup.Indicator />

                <SegmentGroup.Items items={items} />
            </SegmentGroup.Root>
        </Flex>
    )
}
