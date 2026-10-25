import { Tabs, type TabsValueChangeDetails } from "@chakra-ui/react"
import type { FieldBossRegion } from "@timers/config/fieldBosses"
import type { Server } from "@timers/config/servers"
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
    server: Server
    region: FieldBossRegion
    regions: FieldBossRegion[]
    focusedTimer?: TimerId
    timers: TimerEntry[]
    now: number
    shared: boolean
    onTabChange: (tab: TimerCategory) => void
    onServerChange: (server: string) => void
    onSharedChange: (shared: boolean) => void
    onRegionChange: (region: FieldBossRegion) => void
    onTogglePinned: (id: TimerId) => void
    onColorChange: (id: TimerId, color: TimerColor) => void
    onColorReset: (id: TimerId) => void
    onSoonMinutesChange: (id: TimerId, minutes: number) => void
    onBossReportChange: (id: TimerId, report: BossReport | null) => void
}

export const TimerTabs = ({
    tab,
    server,
    region,
    regions,
    focusedTimer,
    timers,
    now,
    shared,
    onTabChange,
    onServerChange,
    onSharedChange,
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
                            server={server}
                            region={region}
                            regions={regions}
                            entries={group.entries}
                            focusedTimer={focusedTimer}
                            now={now}
                            shared={shared}
                            onServerChange={onServerChange}
                            onSharedChange={onSharedChange}
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
