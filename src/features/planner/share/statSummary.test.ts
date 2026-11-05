import { describe, expect, it } from "vitest"
import { DEFAULT_STAT_SETTINGS } from "@planner/storage/statPriorities"
import { statSummaryRows } from "./statSummary"

describe("statSummaryRows", () => {
    it("numbers stats by group, shows Max and lists ignored ones last", () => {
        const rows = statSummaryRows({
            ...DEFAULT_STAT_SETTINGS,
            order: ["attack", "max-hp", "defense"],
            tied: ["defense"],
            ignored: ["max-mp"],
            max: {
                ...DEFAULT_STAT_SETTINGS.max,
                attack: { enabled: true, skillAfter: 4, passiveAfter: null },
            },
        })

        expect(rows).toEqual([
            {
                stat: "attack",
                label: "1. Attack",
                value: "Max · Skill 4 · Passive –",
                color: "app.accent",
            },
            {
                stat: "max-hp",
                label: "2. Max HP",
                value: undefined,
                color: "app.accent",
            },
            {
                stat: "defense",
                label: "2. Defense",
                value: undefined,
                color: "app.accent",
            },
            {
                stat: "max-mp",
                label: "Max MP",
                value: "Ignored",
                color: "app.subtle",
            },
        ])
    })
})
