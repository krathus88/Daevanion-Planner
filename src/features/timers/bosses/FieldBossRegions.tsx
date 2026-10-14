import { Flex, Grid, SegmentGroup, Text } from "@chakra-ui/react"
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
    // A boss to scroll to and open for input.
    focusedTimer?: TimerId
    now: number
    onRegionChange: (region: FieldBossRegion) => void
    onTogglePinned: (id: TimerId) => void
    onColorChange: (id: TimerId, color: TimerColor) => void
    onColorReset: (id: TimerId) => void
    onSoonMinutesChange: (id: TimerId, minutes: number) => void
    onReportChange: (id: TimerId, report: BossReport | null) => void
}

// The field bosses of one region at a time: Verteron, Altgard or the Abyss.
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

    // Longest respawn first, as those are the bosses worth planning around;
    // then by name.
    const shown = entries
        .filter((entry) => entry.timer.boss?.region === region)
        .sort(
            (a, b) =>
                (b.timer.boss?.respawn ?? 0) - (a.timer.boss?.respawn ?? 0) ||
                a.timer.name.localeCompare(b.timer.name),
        )

    return (
        <Flex flexDir="column" gap="4">
            <SegmentGroup.Root
                layout="fill"
                maxW="xl"
                value={region}
                aria-label="Region"
                onValueChange={handleValueChange}
            >
                <SegmentGroup.Indicator />

                {FIELD_BOSS_REGIONS.map((item) => (
                    <SegmentGroup.Item key={item.id} value={item.id}>
                        <SegmentGroup.ItemText>
                            <Text as="span" hideBelow="md">
                                {item.label}
                            </Text>

                            <Text as="span" hideFrom="md">
                                {item.shortLabel}
                            </Text>
                        </SegmentGroup.ItemText>

                        <SegmentGroup.ItemHiddenInput />
                    </SegmentGroup.Item>
                ))}
            </SegmentGroup.Root>

            {region === "abyss" && (
                <Text textStyle="hint">
                    Chaotic Lower Reshanta has no global schedule yet. Mark a
                    kill to see how long ago it was; the Korean times are only a
                    reference.
                </Text>
            )}

            {/* As many columns as fit at about 18rem each, up to three. */}
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

            <Text textStyle="hint">
                Respawn times are counted from the kill. The in-game Field Boss
                list is always the exact time.
            </Text>
        </Flex>
    )
}
