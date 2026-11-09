import { SegmentGroup } from "@chakra-ui/react"
import {
    STAT_TIER_NAMES,
    STAT_TIERS,
    type StatTier,
} from "@planner/config/stats"
import { STAT_TIER_COLORS } from "./tierColors"

// Ignore is clicking the stat's name, not a tier.
const PICKED_TIERS = STAT_TIERS.filter((tier) => tier !== "ignore")

type StatTierPickerProps = {
    // Null: none picked (an ignored stat).
    value: StatTier | null
    disabled?: boolean
    label: string
    onChange: (tier: StatTier) => void
}

export const StatTierPicker = ({
    value,
    disabled = false,
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
            disabled={disabled}
            aria-label={label}
            onValueChange={handleValueChange}
        >
            <SegmentGroup.Indicator />

            {PICKED_TIERS.map((tier) => (
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
