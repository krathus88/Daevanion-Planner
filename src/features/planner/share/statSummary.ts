import type { Tokens } from "@chakra-ui/react"
import { STAT_NAMES, type StatType } from "@config/stats/stats"
import { statGroups } from "@planner/logic/statOrder"
import type { StatMax, StatSettings } from "@planner/storage/statPriorities"

type StatSummaryRow = {
    stat: StatType
    label: string
    value?: string
    color: Tokens["colors"]
}

const maxText = (max: StatMax) => {
    return `Max · Skill ${max.skillAfter ?? "–"} · Passive ${max.passiveAfter ?? "–"}`
}

// Tied stats share a number, like "2. Max HP" and "2. Defense".
export const statSummaryRows = (settings: StatSettings) => {
    const rows: StatSummaryRow[] = []
    const groups = statGroups(settings)
    for (let index = 0; index < groups.length; index += 1) {
        for (const stat of groups[index]) {
            const max = settings.max[stat]
            rows.push({
                stat: stat,
                label: `${index + 1}. ${STAT_NAMES[stat]}`,
                value: max.enabled ? maxText(max) : undefined,
                color: "app.accent",
            })
        }
    }

    for (const stat of settings.ignored) {
        rows.push({
            stat: stat,
            label: STAT_NAMES[stat],
            value: "Ignored",
            color: "app.subtle",
        })
    }

    return rows
}
