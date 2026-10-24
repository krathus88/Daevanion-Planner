import { Flex, Text } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import { STAT_NAMES, type StatType } from "@config/stats/stats"
import type { StatTier } from "@planner/config/stats"
import type { StatFocusStat } from "@planner/storage/statPriorities"
import { LimitInput } from "./LimitInput"
import { STAT_TIER_COLORS } from "./tierColors"

const MAX_DETOUR = 20

type StatFocusStatRowProps = {
    stat: StatType
    tier: StatTier
    value: StatFocusStat
    isBoard: boolean
    onChange: (stat: StatType, value: StatFocusStat) => void
}

const toOptionalCount = (text: string, min: number, max: number) => {
    if (text === "") {
        return null
    }

    const next = Math.floor(Number(text))

    return Number.isFinite(next) ? Math.min(max, Math.max(min, next)) : null
}

export const StatFocusStatRow = ({
    stat,
    tier,
    value,
    isBoard,
    onChange,
}: StatFocusStatRowProps) => {
    const handlePassiveAfterChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(stat, {
            ...value,
            passiveAfter: toOptionalCount(event.target.value, 1, 99),
        })
    }

    const handleSkillAfterChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(stat, {
            ...value,
            skillAfter: toOptionalCount(event.target.value, 1, 99),
        })
    }

    const handleDetourChange = (event: ChangeEvent<HTMLInputElement>) => {
        onChange(stat, {
            ...value,
            detour: toOptionalCount(event.target.value, 0, MAX_DETOUR) ?? 0,
        })
    }

    const name = STAT_NAMES[stat]

    return (
        <Flex minW="0" alignItems="center" gap="2">
            <Text
                minW="0"
                flex="1"
                color={STAT_TIER_COLORS[tier]}
                fontSize="sm"
                truncate
            >
                {name}
            </Text>

            {!isBoard && (
                <LimitInput
                    max={99}
                    min={1}
                    placeholder="–"
                    value={value.skillAfter ?? ""}
                    title="Leave empty so skills never wait for this stat"
                    aria-label={`${name} comes before skills ranked after`}
                    onChange={handleSkillAfterChange}
                />
            )}

            {!isBoard && (
                <LimitInput
                    max={99}
                    min={1}
                    placeholder="–"
                    value={value.passiveAfter ?? ""}
                    title="Leave empty so passives never wait for this stat"
                    aria-label={`${name} comes before passives ranked after`}
                    onChange={handlePassiveAfterChange}
                />
            )}

            <LimitInput
                max={MAX_DETOUR}
                min={0}
                value={value.detour}
                title="Most points one node may cost to reach, the node included; 0 never adds it"
                aria-label={`${name} detour points`}
                onChange={handleDetourChange}
            />
        </Flex>
    )
}
