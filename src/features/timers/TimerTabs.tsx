import { Tabs, type TabsValueChangeDetails } from "@chakra-ui/react"
import type { FieldBossRegion } from "@timers/config/fieldBosses"
import {
    isTimerCategory,
    TIMER_CATEGORIES,
    type TimerCategory,
    type TimerColor,
    type TimerId,
} from "@timers/config/timers"
import type { TimerEntry } from "@timers/hooks/useTimers"
import type { BossReport } from "@timers/storage/timerSettings"
import { FieldBossRegions } from "./bosses/FieldBossRegions"
import { TimerGrid } from "./TimerGrid"

type TimerTabsProps = {
    tab: TimerCategory
    region: FieldBossRegion
    focusedTimer?: TimerId
    timers: TimerEntry[]
    now: number
    onTabChange: (tab: TimerCategory) => void
    onRegionChange: (region: FieldBossRegion) => void
    onTogglePinned: (id: TimerId) => void
    onColorChange: (id: TimerId, color: TimerColor) => void
    onColorReset: (id: TimerId) => void
    onSoonMinutesChange: (id: TimerId, minutes: number) => void
    onBossReportChange: (id: TimerId, report: BossReport | null) => void
}

export const TimerTabs = ({
    tab,
    region,
    focusedTimer,
    timers,
    now,
    onTabChange,
    onRegionChange,
    onTogglePinned,
    onColorChange,
    onColorReset,
    onSoonMinutesChange,
    onBossReportChange,
}: TimerTabsProps) => {
    const handleValueChange = (details: TabsValueChangeDetails) => {
        if (isTimerCategory(details.value)) {
            onTabChange(details.value)
        }
    }

    const groups = TIMER_CATEGORIES.map((category) => ({
        category: category,
        entries: timers.filter((entry) => entry.timer.category === category.id),
    }))

    return (
        <Tabs.Root variant="line" value={tab} onValueChange={handleValueChange}>
            <Tabs.List>
                {TIMER_CATEGORIES.map((category) => (
                    <Tabs.Trigger key={category.id} value={category.id}>
                        {category.label}
                    </Tabs.Trigger>
                ))}
            </Tabs.List>

            {groups.map((group) => (
                <Tabs.Content
                    key={group.category.id}
                    value={group.category.id}
                    pt="4"
                >
                    {group.category.id === "boss" ? (
                        <FieldBossRegions
                            region={region}
                            entries={group.entries}
                            focusedTimer={focusedTimer}
                            now={now}
                            onRegionChange={onRegionChange}
                            onTogglePinned={onTogglePinned}
                            onColorChange={onColorChange}
                            onColorReset={onColorReset}
                            onSoonMinutesChange={onSoonMinutesChange}
                            onReportChange={onBossReportChange}
                        />
                    ) : (
                        <TimerGrid
                            entries={group.entries}
                            now={now}
                            onTogglePinned={onTogglePinned}
                            onColorChange={onColorChange}
                            onColorReset={onColorReset}
                            onSoonMinutesChange={onSoonMinutesChange}
                        />
                    )}
                </Tabs.Content>
            ))}
        </Tabs.Root>
    )
}
