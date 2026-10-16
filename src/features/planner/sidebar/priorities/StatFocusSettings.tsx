import type { StatType } from "@config/stats/stats"
import { Flex, Switch, Text } from "@chakra-ui/react"
import type { StatTier } from "@planner/config/stats"
import type { StatFocus, StatFocusStat } from "@planner/storage/statPriorities"
import { Section } from "@common/Section"
import { StatFocusColumnHeaders } from "./StatFocusColumnHeaders"
import { StatFocusStatRow } from "./StatFocusStatRow"

type StatFocusSettingsProps = {
    focus: StatFocus
    stats: readonly StatType[]
    tiers: Readonly<Record<StatType, StatTier>>
    // On one board there are no ranks: only each stat's detour applies.
    isBoard: boolean
    onChange: (focus: StatFocus) => void
}

export const StatFocusSettings = ({
    focus,
    stats,
    tiers,
    isBoard,
    onChange,
}: StatFocusSettingsProps) => {
    const handleEnabledChange = (details: Switch.CheckedChangeDetails) => {
        onChange({ ...focus, enabled: details.checked })
    }

    const handleStatChange = (stat: StatType, value: StatFocusStat) => {
        onChange({ ...focus, stats: { ...focus.stats, [stat]: value } })
    }

    return (
        <Section variant="nested" title="Stat focus (advanced)">
            <Switch.Root
                size="sm"
                checked={focus.enabled}
                onCheckedChange={handleEnabledChange}
            >
                <Switch.HiddenInput />

                <Switch.Control />

                <Switch.Label>
                    {isBoard
                        ? "Add stat nodes near the route"
                        : "Put stats ahead of low-ranked abilities"}
                </Switch.Label>
            </Switch.Root>

            {isBoard ? (
                <Text textStyle="hint">
                    When on, Find a good path adds each stat&apos;s nodes near
                    the route, best tier first, while points last here. These
                    settings are shared with the All boards tab.
                </Text>
            ) : (
                <Text textStyle="hint">
                    When on, each stat&apos;s nodes take points before the
                    passives and skills ranked after the numbers you set, e.g.
                    Attack before a rank 5 healing passive. Special nodes and
                    Min always come first. Leave Passive or Skill empty so that
                    type never waits for the stat.
                </Text>
            )}

            {focus.enabled && (
                <Flex flexDir="column" gap="2">
                    <StatFocusColumnHeaders isBoard={isBoard} />

                    {stats.map((stat) => (
                        <StatFocusStatRow
                            key={stat}
                            stat={stat}
                            tier={tiers[stat]}
                            value={focus.stats[stat]}
                            isBoard={isBoard}
                            onChange={handleStatChange}
                        />
                    ))}

                    <Text textStyle="hint">
                        Detour is the most points one of the stat&apos;s nodes
                        may cost to reach, the node included: 1 takes nodes
                        touching the route, 2 one node further, and 0 never adds
                        the stat. Each added node becomes part of the route, and
                        nodes closer to{" "}
                        {isBoard
                            ? "preferred abilities not on the route yet"
                            : "abilities still waiting"}{" "}
                        are taken first.
                    </Text>
                </Flex>
            )}
        </Section>
    )
}
