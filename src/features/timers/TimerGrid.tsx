import { Grid } from "@chakra-ui/react"
import type { TimerColor, TimerId } from "@timers/config/timers"
import type { TimerEntry } from "@timers/hooks/useTimers"
import { TimerCard } from "./card/TimerCard"

type TimerGridProps = {
    entries: TimerEntry[]
    now: number
    onTogglePinned: (id: TimerId) => void
    onColorChange: (id: TimerId, color: TimerColor) => void
    onColorReset: (id: TimerId) => void
    onSoonMinutesChange: (id: TimerId, minutes: number) => void
}

export const TimerGrid = ({
    entries,
    now,
    onTogglePinned,
    onColorChange,
    onColorReset,
    onSoonMinutesChange,
}: TimerGridProps) => {
    return (
        <Grid
            templateColumns={{
                base: "1fr",
                md: "repeat(2, 1fr)",
                xl: "repeat(3, 1fr)",
            }}
            alignItems="start"
            gap="4"
        >
            {entries.map((entry) => (
                <TimerCard
                    key={entry.timer.id}
                    entry={entry}
                    now={now}
                    onTogglePinned={onTogglePinned}
                    onColorChange={onColorChange}
                    onColorReset={onColorReset}
                    onSoonMinutesChange={onSoonMinutesChange}
                />
            ))}
        </Grid>
    )
}
