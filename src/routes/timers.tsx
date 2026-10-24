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
    tab?: TimerCategory
    region?: FieldBossRegion
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
