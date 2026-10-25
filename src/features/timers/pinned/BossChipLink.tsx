import { Link } from "@chakra-ui/react"
import { Link as RouterLink } from "@tanstack/react-router"
import type { TimerEntry } from "@timers/hooks/useTimers"
import { TimerChip } from "./TimerChip"

type BossChipLinkProps = {
    entry: TimerEntry
    now: number
}

// Opens the boss's row on the Timers page.
export const BossChipLink = ({ entry, now }: BossChipLinkProps) => {
    const label =
        entry.state.status === "unset"
            ? `Set the ${entry.timer.name} timer`
            : `Go to ${entry.timer.name}`

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
                aria-label={label}
            >
                <TimerChip entry={entry} now={now} />
            </RouterLink>
        </Link>
    )
}
