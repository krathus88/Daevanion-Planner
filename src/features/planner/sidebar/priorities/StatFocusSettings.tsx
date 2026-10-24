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
                    Adds each stat&apos;s nearby nodes to the route, best tier
                    first. Shared with All boards.
                </Text>
            ) : (
                <Text textStyle="hint">
                    Stat nodes take points before skills and passives ranked
                    after the numbers you set. Leave a field empty to never
                    wait.
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
                        Detour: most points to reach a node, the node included.
                        0 never adds the stat.
                    </Text>
                </Flex>
            )}
        </Section>
    )
}
