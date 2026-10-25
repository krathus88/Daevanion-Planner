import type { TimerEntry } from "@timers/hooks/useTimers"
import { BossChipLink } from "./BossChipLink"
import { TimerChip } from "./TimerChip"

type HeaderTimerChipProps = {
    entry: TimerEntry
    now: number
}

// Boss chips link to their row; the rest only show the time.
export const HeaderTimerChip = ({ entry, now }: HeaderTimerChipProps) => {
    return entry.timer.boss ? (
        <BossChipLink entry={entry} now={now} />
    ) : (
        <TimerChip entry={entry} now={now} />
    )
}
