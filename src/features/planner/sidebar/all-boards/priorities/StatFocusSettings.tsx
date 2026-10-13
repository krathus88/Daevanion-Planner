import { Flex, Switch, Text } from "@chakra-ui/react"
import type { ChangeEvent } from "react"
import { FOCUS_TIERS, type FocusTier } from "@planner/config/stats"
import type { StatFocus, StatFocusTier } from "@planner/storage/statPriorities"
import { Section } from "@common/Section"
import { LimitInput } from "./LimitInput"
import { StatFocusColumnHeaders } from "./StatFocusColumnHeaders"
import { StatFocusTierRow } from "./StatFocusTierRow"

const MAX_DETOUR = 20

type StatFocusSettingsProps = {
    focus: StatFocus
    onChange: (focus: StatFocus) => void
}

export const StatFocusSettings = ({
    focus,
    onChange,
}: StatFocusSettingsProps) => {
    const handleEnabledChange = (details: Switch.CheckedChangeDetails) => {
        onChange({ ...focus, enabled: details.checked })
    }

    const handleTierChange = (tier: FocusTier, value: StatFocusTier) => {
        onChange({ ...focus, tiers: { ...focus.tiers, [tier]: value } })
    }

    const handleDetourChange = (event: ChangeEvent<HTMLInputElement>) => {
        const next = Math.floor(Number(event.target.value))
        onChange({
            ...focus,
            detour: Number.isFinite(next)
                ? Math.min(MAX_DETOUR, Math.max(0, next))
                : 0,
        })
    }

    return (
        <Section variant="sub" title="Stat focus (advanced)">
            <Switch.Root
                size="sm"
                checked={focus.enabled}
                onCheckedChange={handleEnabledChange}
            >
                <Switch.HiddenInput />

                <Switch.Control />

                <Switch.Label>
                    Put stats ahead of low-ranked abilities
                </Switch.Label>
            </Switch.Root>

            <Text textStyle="hint">
                When on, each tier&apos;s stat nodes take points before the
                passives and skills ranked after the numbers you set, e.g.
                Attack and Critical Hit before a rank 5 healing passive. Special
                nodes and Min always come first. Leave Passive or Skill empty so
                that type never waits, and Up to empty to take all the budget
                allows.
            </Text>

            {focus.enabled && (
                <Flex flexDir="column" gap="2">
                    <StatFocusColumnHeaders />

                    {FOCUS_TIERS.map((tier) => (
                        <StatFocusTierRow
                            key={tier}
                            tier={tier}
                            value={focus.tiers[tier]}
                            onChange={handleTierChange}
                        />
                    ))}

                    <Flex minW="0" alignItems="center" gap="2">
                        <Text minW="0" flex="1" fontSize="sm" truncate>
                            Detour points per stat node
                        </Text>

                        <LimitInput
                            max={MAX_DETOUR}
                            min={0}
                            value={focus.detour}
                            title="Most points spent on other nodes to reach one stat node"
                            aria-label="Detour points per stat node"
                            onChange={handleDetourChange}
                        />
                    </Flex>

                    <Text textStyle="hint">
                        How far it may go out of its way for a stat node: 0 only
                        takes stat nodes touching the route. Nodes closer to
                        abilities still waiting are taken first, so branches
                        tend to lead somewhere useful.
                    </Text>
                </Flex>
            )}
        </Section>
    )
}
