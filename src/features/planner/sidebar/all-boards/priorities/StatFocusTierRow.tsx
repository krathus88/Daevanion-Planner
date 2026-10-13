import { Flex, Text } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import { STAT_TIER_NAMES, type FocusTier } from "@planner/config/stats"
import type { StatFocusTier } from "@planner/storage/statPriorities"
import { LimitInput } from "./LimitInput"
import { STAT_TIER_COLORS } from "./tierColors"

type StatFocusTierRowProps = {
    tier: FocusTier
    value: StatFocusTier
    onChange: (tier: FocusTier, value: StatFocusTier) => void
}

// Empty clears the field; anything else becomes a whole number in range.
const toOptionalCount = (text: string, min: number, max: number) => {
    if (text === "") {
        return null
    }

    const next = Math.floor(Number(text))

    return Number.isFinite(next) ? Math.min(max, Math.max(min, next)) : null
}

export const StatFocusTierRow = ({
    tier,
    value,
    onChange,
}: StatFocusTierRowProps) => {
    const handleAfterRankChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(tier, {
            ...value,
            afterRank: toOptionalCount(event.target.value, 1, 99),
        })
    }

    const handleCapChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(tier, {
            ...value,
            cap: toOptionalCount(event.target.value, 0, 999),
        })
    }

    const name = STAT_TIER_NAMES[tier]

    return (
        <Flex minW="0" alignItems="center" gap="2">
            <Text
                minW="0"
                flex="1"
                color={STAT_TIER_COLORS[tier]}
                fontSize="sm"
                truncate
            >
                {name} stats
            </Text>

            <LimitInput
                max={99}
                min={1}
                placeholder="–"
                value={value.afterRank ?? ""}
                title="Leave empty to leave this tier out"
                aria-label={`${name} stats come before abilities ranked after`}
                onChange={handleAfterRankChange}
            />

            <LimitInput
                max={999}
                min={0}
                placeholder="All"
                value={value.cap ?? ""}
                title="Most nodes across all boards; leave empty to take all the budget allows"
                aria-label={`Most ${name} stat nodes to take`}
                onChange={handleCapChange}
            />
        </Flex>
    )
}
