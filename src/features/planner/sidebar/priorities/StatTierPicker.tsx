import { SegmentGroup } from "@chakra-ui/react"
import {
    STAT_TIER_NAMES,
    STAT_TIERS,
    type StatTier,
} from "@planner/config/stats"
import { STAT_TIER_COLORS } from "./tierColors"

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
                    _checked={{ color: STAT_TIER_COLORS[tier] }}
                    _hover={{ color: STAT_TIER_COLORS[tier] }}
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
