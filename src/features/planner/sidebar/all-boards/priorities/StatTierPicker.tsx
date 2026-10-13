import { SegmentGroup } from "@chakra-ui/react"
import {
    STAT_TIER_NAMES,
    STAT_TIERS,
    type StatTier,
} from "@planner/config/stats"

const tierColors = {
    best: "app.accent",
    good: "app.success",
    okay: "app.info",
    ignore: "app.subtle",
} as const

type StatTierPickerProps = {
    value: StatTier
    label: string
    onChange: (tier: StatTier) => void
}

export const StatTierPicker = ({
    value,
    label,
    onChange,
}: StatTierPickerProps) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        onChange(details.value as StatTier)
    }

    return (
        <SegmentGroup.Root
            layout="compact"
            value={value}
            flexShrink="0"
            aria-label={label}
            onValueChange={handleValueChange}
        >
            <SegmentGroup.Indicator />

            {STAT_TIERS.map((tier) => (
                <SegmentGroup.Item
                    key={tier}
                    value={tier}
                    color="app.subtle"
                    _checked={{ color: tierColors[tier] }}
                    _hover={{ color: tierColors[tier] }}
                >
                    <SegmentGroup.ItemText>
                        {STAT_TIER_NAMES[tier]}
                    </SegmentGroup.ItemText>

                    <SegmentGroup.ItemHiddenInput />
                </SegmentGroup.Item>
            ))}
        </SegmentGroup.Root>
    )
}
