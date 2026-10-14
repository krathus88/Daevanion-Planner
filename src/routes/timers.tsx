import { createFileRoute } from "@tanstack/react-router"
import {
    isFieldBossRegion,
    type FieldBossRegion,
} from "@timers/config/fieldBosses"
import {
    isTimerCategory,
    isTimerId,
    type TimerCategory,
    type TimerId,
} from "@timers/config/timers"
import { TimersPage } from "@timers/TimersPage"

type TimersSearch = {
    // The open tab.
    tab?: TimerCategory
    // The open region on the Field bosses tab.
    region?: FieldBossRegion
    // A timer to scroll to and open for input, e.g. from a pinned
    // "set timer" chip. Cleared once handled.
    timer?: TimerId
}

export const Route = createFileRoute("/timers")({
    validateSearch: (search: Record<string, unknown>): TimersSearch => {
        return {
            tab: isTimerCategory(search.tab) ? search.tab : undefined,
            region: isFieldBossRegion(search.region)
                ? search.region
                : undefined,
            timer: isTimerId(search.timer) ? search.timer : undefined,
        }
    },
    component: TimersPage,
})
