import type { ClassPreset } from "@config/classPresets"
import { Flex, Switch, Text } from "@chakra-ui/react"
import type { MainBoardId } from "@config/boards"
import { STAT_TYPES } from "@config/stats/stats"
import { useStatNodeCounts } from "@planner/hooks/useStatNodeCounts"
import { useStatSettings } from "@planner/hooks/useStatSettings"
import type { StatFocus } from "@planner/storage/statPriorities"
import { StatusText } from "@common/StatusText"
import { Term } from "@common/Term"
import { StatFocusSettings } from "./StatFocusSettings"
import { StatPriorityRow } from "./StatPriorityRow"

type StatPriorityListProps = {
    classPreset: ClassPreset
    layout?: MainBoardId
}

export const StatPriorityList = ({
    classPreset,
    layout,
}: StatPriorityListProps) => {
    const { settings, error, update } = useStatSettings(classPreset.id)
    const nodeCounts = useStatNodeCounts(classPreset.id, layout)

    const stats = STAT_TYPES.filter(
        (stat) =>
            !layout || !nodeCounts.counts || nodeCounts.counts[stat].total > 0,
    )

    const handleSpendLeftoverChange = (
        details: Switch.CheckedChangeDetails,
    ) => {
        update({ ...settings, spendLeftover: details.checked })
    }

    const handleFocusChange = (focus: StatFocus) => {
        update({ ...settings, focus: focus })
    }

    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="hint">
                Better <Term>stats</Term> win between routes of equal cost.
            </Text>

            {stats.map((stat) => (
                <StatPriorityRow
                    key={stat}
                    stat={stat}
                    settings={settings}
                    count={nodeCounts.counts?.[stat]}
                    layout={layout}
                    onSettingsChange={update}
                />
            ))}

            <Switch.Root
                size="sm"
                mt="2"
                checked={settings.spendLeftover}
                onCheckedChange={handleSpendLeftoverChange}
            >
                <Switch.HiddenInput />

                <Switch.Control />

                <Switch.Label>Spend leftover points on stats</Switch.Label>
            </Switch.Root>

            <Text textStyle="hint">
                Spends leftover points on the best <Term>stat</Term> nodes.
            </Text>

            <StatFocusSettings
                focus={settings.focus}
                stats={stats}
                tiers={settings.tiers}
                isBoard={layout !== undefined}
                onChange={handleFocusChange}
            />

            {error && <StatusText>{error}</StatusText>}

            {nodeCounts.error && <StatusText>{nodeCounts.error}</StatusText>}
        </Flex>
    )
}
