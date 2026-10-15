import { Button, Flex, Text } from "@chakra-ui/react"
import type { BoardId } from "@config/boards"
import { classPresets } from "@config/classPresets"
import { STAT_NAMES, STAT_TYPES } from "@config/stats/stats"
import { Section } from "@common/Section"
import { StatusText } from "@common/StatusText"
import { useState } from "react"
import { STAT_TIER_NAMES } from "@planner/config/stats"
import { SPECIAL_BONUSES } from "@planner/config/specialNodes"
import { STAT_TIER_COLORS } from "@planner/sidebar/all-boards/priorities/tierColors"
import {
    readAbilityMaximums,
    readAbilityMinimums,
    readAbilityPriorities,
} from "@planner/storage/abilityPriorities"
import { readAllClassSettings } from "@planner/storage/classSettings"
import {
    RANK_GROUP_NAMES,
    RANK_GROUPS,
    readRankOrder,
    SAME_RANK_ORDER_NAMES,
} from "@planner/storage/rankOrder"
import {
    readSpecialPriorities,
    SPECIAL_BONUS_TYPES,
} from "@planner/storage/specialPriorities"
import { readStatSettings } from "@planner/storage/statPriorities"
import { bumpStorageRevision } from "@planner/storage/storageRevision"
import { BackToMyPlansLink } from "./BackToMyPlansLink"
import { applySharedSettings, type SharedPlan } from "./shareCode"
import { SummaryRow } from "./SummaryRow"

type SharedSettingsPanelProps = {
    plan: SharedPlan
    layout: BoardId
}

// Already the viewer's settings, e.g. right after applying them.
const isInUse = (plan: SharedPlan) => {
    try {
        return (
            JSON.stringify(readAllClassSettings(plan.classId)) ===
            JSON.stringify(plan.settings)
        )
    } catch {
        return false
    }
}

// The link's settings, read the same way the planner reads its own. Null
// if they can't be read.
const readSummary = (plan: SharedPlan) => {
    const classPreset = classPresets[plan.classId]
    const settings = plan.settings ?? {}

    try {
        return {
            priorities: readAbilityPriorities(classPreset, settings),
            minimums: readAbilityMinimums(classPreset, settings),
            maximums: readAbilityMaximums(classPreset, settings),
            special: readSpecialPriorities(plan.classId, settings),
            rankOrder: readRankOrder(plan.classId, settings),
            stats: readStatSettings(plan.classId, settings),
        }
    } catch {
        return null
    }
}

// A settings-only link: the shared optimizer settings, with a button to use
// them. Shown in place of the sidebar's tabs.
export const SharedSettingsPanel = ({
    plan,
    layout,
}: SharedSettingsPanelProps) => {
    const [error, setError] = useState<string | null>(null)

    const classPreset = classPresets[plan.classId]
    const summary = readSummary(plan)
    const isApplied = isInUse(plan)

    const handleApply = () => {
        const applyError = applySharedSettings(plan)
        setError(applyError)
        if (!applyError) {
            // Remounts the board so it uses the new settings.
            bumpStorageRevision()
        }
    }

    const limitsOf = (abilityId: string) => {
        if (!summary) {
            return ""
        }

        const minimum = summary.minimums[abilityId]
        const maximum = summary.maximums[abilityId]
        return [
            minimum !== undefined && `Min ${minimum}`,
            maximum !== undefined && `Max ${maximum}`,
        ]
            .filter(Boolean)
            .join(" · ")
    }

    return (
        <Flex minH="0" flex="1" p="4" flexDir="column" gap="4" overflowY="auto">
            <Flex flexDir="column" gap="1">
                <Text fontWeight="semibold">
                    Shared {classPreset.name} settings
                </Text>

                <Text textStyle="hint">
                    Read-only optimizer settings, with no routes or points.
                    Using them replaces your {classPreset.name} settings. Your
                    boards and saved plans stay as they are.
                </Text>
            </Flex>

            <Flex flexWrap="wrap" gap="2">
                <Button
                    variant="primary"
                    size="sm"
                    disabled={isApplied || !summary}
                    onClick={handleApply}
                >
                    {isApplied ? "In use" : "Use these settings"}
                </Button>

                <BackToMyPlansLink classId={plan.classId} layout={layout} />
            </Flex>

            {isApplied && (
                <StatusText tone="muted">
                    These are now your {classPreset.name} optimizer settings.
                </StatusText>
            )}

            {error && <StatusText>{error}</StatusText>}

            {summary ? (
                <>
                    <Section defaultOpen title="Ability ranks">
                        {[...classPreset.abilities]
                            .sort(
                                (a, b) =>
                                    summary.priorities[a.id] -
                                    summary.priorities[b.id],
                            )
                            .map((ability) => (
                                <SummaryRow
                                    key={ability.id}
                                    label={`${summary.priorities[ability.id]}. ${ability.name}`}
                                    value={limitsOf(ability.id)}
                                />
                            ))}
                    </Section>

                    <Section defaultOpen title="Special nodes">
                        {[...SPECIAL_BONUS_TYPES]
                            .sort(
                                (a, b) =>
                                    summary.special[a] - summary.special[b],
                            )
                            .map((bonus) => (
                                <SummaryRow
                                    key={bonus}
                                    label={`${summary.special[bonus]}. ${SPECIAL_BONUSES[bonus].name}`}
                                />
                            ))}
                    </Section>

                    <Section defaultOpen title="Same-rank order">
                        {RANK_GROUPS.map((group) => (
                            <SummaryRow
                                key={group}
                                label={RANK_GROUP_NAMES[group]}
                                value={
                                    SAME_RANK_ORDER_NAMES[
                                        summary.rankOrder[group]
                                    ]
                                }
                            />
                        ))}
                    </Section>

                    <Section defaultOpen title="Stats">
                        {STAT_TYPES.map((stat) => (
                            <SummaryRow
                                key={stat}
                                label={STAT_NAMES[stat]}
                                value={
                                    STAT_TIER_NAMES[summary.stats.tiers[stat]]
                                }
                                valueColor={
                                    STAT_TIER_COLORS[summary.stats.tiers[stat]]
                                }
                            />
                        ))}

                        <SummaryRow
                            label="Spend leftover points"
                            value={summary.stats.spendLeftover ? "On" : "Off"}
                        />

                        <SummaryRow
                            label="Stat focus"
                            value={summary.stats.focus.enabled ? "On" : "Off"}
                        />
                    </Section>
                </>
            ) : (
                <StatusText>These settings could not be read.</StatusText>
            )}
        </Flex>
    )
}
