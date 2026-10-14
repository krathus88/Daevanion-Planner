import { Link } from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import type { TimerEntry } from "@timers/hooks/useTimers"
import { TimerChip } from "./TimerChip"

type SetTimerChipProps = {
    entry: TimerEntry
    now: number
}

// A pinned timer still waiting for input ("set timer"). Opens its card on
// the Timers page, ready to type the in-game countdown.
export const SetTimerChip = ({ entry, now }: SetTimerChipProps) => {
    return (
        <Link
            asChild
            display="flex"
            borderRadius="md"
            textDecoration="none"
            _hover={{ textDecoration: "none", filter: "brightness(1.25)" }}
        >
            <RouterLink
                to="/timers"
                search={{
                    tab: entry.timer.category,
                    region: entry.timer.boss?.region,
                    timer: entry.timer.id,
                }}
                aria-label={`Set the ${entry.timer.name} timer`}
            >
                <TimerChip entry={entry} now={now} />
            </RouterLink>
        </Link>
    )
}
