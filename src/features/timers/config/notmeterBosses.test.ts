import { describe, expect, it } from "vitest"
import { FIELD_BOSSES } from "./fieldBosses"
import { NOTMETER_BOSS_CODES } from "./notmeterBosses"

describe("NOTMETER_BOSS_CODES", () => {
    it("has a code for every boss without a fixed schedule", () => {
        const mapped = new Set(Object.values(NOTMETER_BOSS_CODES))
        const missing = FIELD_BOSSES.filter(
            (boss) => !("schedule" in boss) && !mapped.has(boss.id),
        )

        expect(missing).toEqual([])
    })

    it("gives each boss one code only", () => {
        const ids = Object.values(NOTMETER_BOSS_CODES)

        expect(new Set(ids).size).toBe(ids.length)
    })

    it("leaves out the scheduled Abyss bosses", () => {
        const mapped = new Set(Object.values(NOTMETER_BOSS_CODES))
        const scheduled = FIELD_BOSSES.filter((boss) => "schedule" in boss)

        expect(scheduled.filter((boss) => mapped.has(boss.id))).toEqual([])
    })
})
