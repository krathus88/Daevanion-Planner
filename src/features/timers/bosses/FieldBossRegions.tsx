import { Flex, Grid, SegmentGroup, Text } from "@chakra-ui/react"
import { IconImage } from "@common/IconImage"
import {
    FIELD_BOSS_REGIONS,
    isFieldBossRegion,
    type FieldBossRegion,
} from "@timers/config/fieldBosses"
import type { TimerColor, TimerId } from "@timers/config/timers"
import type { TimerEntry } from "@timers/hooks/useTimers"
import type { BossReport } from "@timers/storage/timerSettings"
import { BossRow } from "./BossRow"

type FieldBossRegionsProps = {
    region: FieldBossRegion
    entries: TimerEntry[]
    focusedTimer?: TimerId
    now: number
    onRegionChange: (region: FieldBossRegion) => void
    onTogglePinned: (id: TimerId) => void
    onColorChange: (id: TimerId, color: TimerColor) => void
    onColorReset: (id: TimerId) => void
    onSoonMinutesChange: (id: TimerId, minutes: number) => void
    onReportChange: (id: TimerId, report: BossReport | null) => void
}

export const FieldBossRegions = ({
    region,
    entries,
    focusedTimer,
    now,
    onRegionChange,
    onTogglePinned,
    onColorChange,
    onColorReset,
    onSoonMinutesChange,
    onReportChange,
}: FieldBossRegionsProps) => {
    const handleValueChange = (details: SegmentGroup.ValueChangeDetails) => {
        if (isFieldBossRegion(details.value)) {
            onRegionChange(details.value)
        }
    }

    // Longest respawn first, then by name; scheduled bosses keep config order.
    const shown = entries
        .filter((entry) => entry.timer.boss?.region === region)
        .sort(
            (a, b) =>
                (b.timer.boss?.respawn ?? 0) - (a.timer.boss?.respawn ?? 0) ||
                (a.timer.boss?.schedule || b.timer.boss?.schedule
                    ? 0
                    : a.timer.name.localeCompare(b.timer.name)),
        )

    return (
        <Flex flexDir="column" gap="4">
            <SegmentGroup.Root
                layout="fill"
                maxW="2xl"
                value={region}
                aria-label="Region"
                onValueChange={handleValueChange}
            >
                <SegmentGroup.Indicator />

                {FIELD_BOSS_REGIONS.map((item) => (
                    <SegmentGroup.Item key={item.id} value={item.id}>
                        <SegmentGroup.ItemText>
                            <Flex
                                as="span"
                                hideBelow="md"
                                alignItems="center"
                                gap="1.5"
                            >
                                <Text as="span">{item.faction}</Text>

                                <IconImage icon={item.icon} size="4" />

                                <Text as="span">{item.zone}</Text>
                            </Flex>

                            <Flex
                                as="span"
                                hideFrom="md"
                                alignItems="center"
                                gap="1.5"
                            >
                                <IconImage icon={item.icon} size="4" />

                                <Text as="span">{item.shortLabel}</Text>
                            </Flex>
                        </SegmentGroup.ItemText>

                        <SegmentGroup.ItemHiddenInput />
                    </SegmentGroup.Item>
                ))}
            </SegmentGroup.Root>

            {region === "abyss" && (
                <Text textStyle="hint">
                    Fixed schedule in EU server time. Marking a kill ends its
                    spawn early.
                </Text>
            )}

            <Grid
                templateColumns="repeat(auto-fit, minmax(min(100%, max(18.25rem, calc((100% - 1rem) / 3))), 1fr))"
                alignItems="start"
                gap="2"
            >
                {shown.map(
                    (entry) =>
                        entry.timer.boss && (
                            <BossRow
                                key={entry.timer.id}
                                entry={entry}
                                boss={entry.timer.boss}
                                now={now}
                                focused={entry.timer.id === focusedTimer}
                                onTogglePinned={onTogglePinned}
                                onColorChange={onColorChange}
                                onColorReset={onColorReset}
                                onSoonMinutesChange={onSoonMinutesChange}
                                onReportChange={onReportChange}
                            />
                        ),
                )}
            </Grid>

            <Text textStyle="hint">Respawns count from the kill.</Text>
        </Flex>
    )
}
