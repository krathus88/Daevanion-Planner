import type { ClassPreset } from "@config/classPresets"
import { Flex, Switch, Text } from "@chakra-ui/react"
import { STAT_TYPES } from "@planner/config/stats"
import { useStatSettings } from "@planner/hooks/useStatSettings"
import { StatusText } from "@common/StatusText"
import { StatPriorityRow } from "./StatPriorityRow"

type StatPriorityListProps = {
    classPreset: ClassPreset
}

export const StatPriorityList = ({ classPreset }: StatPriorityListProps) => {
    const { settings, error, update } = useStatSettings(classPreset.id)

    const handleSpendLeftoverChange = (
        details: Switch.CheckedChangeDetails,
    ) => {
        update({ ...settings, spendLeftover: details.checked })
    }

    return (
        <Flex flexDir="column" gap="2">
            <Text textStyle="label">Stats</Text>

            <Text textStyle="hint">
                When two routes cost the same, the one through better stats
                wins. Stats never make a route cost more, unless you let it
                spend leftover points below.
            </Text>

            {STAT_TYPES.map((stat) => (
                <StatPriorityRow
                    key={stat}
                    stat={stat}
                    settings={settings}
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
                When on, points left after special nodes, Min and ranks go to
                the best stat nodes, without giving up anything else.
            </Text>

            {error && <StatusText>{error}</StatusText>}
        </Flex>
    )
}
