import { describe, expect, it } from "vitest"
import type { SyncConflict } from "./cloudSync"
import { formatEditTime, summarizeConflicts } from "./conflictSummary"
import { PETS_KEY, TIMERS_KEY } from "./syncedKeys"

const conflict = (
    key: string,
    device: unknown,
    account: unknown,
    deviceTime: number | undefined = 1,
    accountTime = 2,
): SyncConflict => {
    return {
        key: key,
        device: device,
        deviceTime: deviceTime,
        account: account,
        accountTime: accountTime,
    }
}

describe("summarizeConflicts", () => {
    it("counts pets with levels", () => {
        const [row] = summarizeConflicts([
            conflict(
                PETS_KEY,
                { levels: { 1: 1 } },
                { levels: { 1: 1, 2: 2 } },
            ),
        ])

        expect(row.label).toBe("Pets")
        expect(row.device.detail).toBe("1 pet with levels")
        expect(row.account.detail).toBe("2 pets with levels")
    })

    it("describes timers", () => {
        const [row] = summarizeConflicts([conflict(TIMERS_KEY, {}, {})])

        expect(row.label).toBe("Timers")
        expect(row.device.detail).toBe("Timer settings")
    })

    it("groups a class's keys and adds up its saved plans", () => {
        const rows = summarizeConflicts([
            conflict(
                "daevanion:v1:gladiator:nezekan:saved-boards",
                [{}],
                [],
                5,
                6,
            ),
            conflict(
                "daevanion:v1:gladiator:zikel:saved-planners",
                [{}, {}],
                [{}],
                9,
                3,
            ),
        ])

        expect(rows).toHaveLength(1)
        expect(rows[0]).toEqual({
            id: "planner:gladiator",
            label: "Gladiator",
            device: { detail: "3 saved plans", time: 9 },
            account: { detail: "1 saved plan", time: 6 },
        })
    })

    it("describes a class with no saved lists in conflict", () => {
        const [row] = summarizeConflicts([
            conflict("daevanion:v1:gladiator:settings", {}, {}),
        ])

        expect(row.device.detail).toBe("Board plans and settings")
    })

    it("falls back to the raw id for an unknown class", () => {
        const [row] = summarizeConflicts([
            conflict("daevanion:v1:mystery:settings", {}, {}),
        ])

        expect(row.label).toBe("mystery")
    })

    it("keeps a missing device time for pre-sync data", () => {
        const [row] = summarizeConflicts([
            {
                key: TIMERS_KEY,
                device: {},
                deviceTime: undefined,
                account: {},
                accountTime: 2,
            },
        ])

        expect(row.device.time).toBeUndefined()
    })
})

describe("formatEditTime", () => {
    it("explains data from before sync", () => {
        expect(formatEditTime(undefined)).toBe("Saved before sync")
    })

    it("shows when it was edited", () => {
        expect(formatEditTime(0)).toMatch(/^Edited /)
    })
})
