import { describe, expect, it } from "vitest"
import { getSnapshotTime, isGameKey, parseGameSnapshot } from "./gameSnapshot"

const CHARACTER = { name: "Testchar", server: 1301, class: 30 }

describe("parseGameSnapshot", () => {
    it("reads every section", () => {
        const snapshot = parseGameSnapshot({
            v: 1,
            character: CHARACTER,
            pets: { "1192": [2, 49] },
            petsAt: 10,
            items: { "1": { "610530001": 229 }, "2": { "610530001": 1313 } },
            bound: { "1": { "310330015": 1 } },
            itemsAt: 20,
            counters: { "60000001": [0, 865] },
            countersAt: 30,
            supply: [{ kind: 1, start: 1, end: 2, cards: 10, delivered: 5 }],
            supplyAt: 40,
            crafts: { "31070001": [8, 0, 50] },
            craftsAt: 50,
            boards: { "1": [33, 34], "5": [1] },
            boardsAt: 60,
            duty: [1, 1794553200000],
            dutyAt: 70,
            progress: { "231210800": [2, 1794524229503] },
            progressAt: 80,
            arena: { "1": [1, 0], "2": [18, 21] },
            arenaAt: 90,
        })

        expect(snapshot).toEqual({
            character: CHARACTER,
            pets: { "1192": [2, 49] },
            petsAt: 10,
            items: { "1": { "610530001": 229 }, "2": { "610530001": 1313 } },
            bound: { "1": { "310330015": 1 } },
            itemsAt: 20,
            counters: { "60000001": [0, 865] },
            countersAt: 30,
            supply: [{ kind: 1, start: 1, end: 2, cards: 10, delivered: 5 }],
            supplyAt: 40,
            crafts: { "31070001": [8, 0, 50] },
            craftsAt: 50,
            boards: { "1": [33, 34], "5": [1] },
            boardsAt: 60,
            duty: [1, 1794553200000],
            dutyAt: 70,
            progress: { "231210800": [2, 1794524229503] },
            progressAt: 80,
            arena: { "1": [1, 0], "2": [18, 21] },
            arenaAt: 90,
        })
    })

    it("leaves out sections the game hasn't sent", () => {
        const snapshot = parseGameSnapshot({ v: 1, character: CHARACTER })

        expect(snapshot?.pets).toBeUndefined()
        expect(snapshot?.counters).toBeUndefined()
        expect(snapshot?.supply).toBeUndefined()
    })

    it("drops bad entries one by one", () => {
        const snapshot = parseGameSnapshot({
            v: 1,
            character: CHARACTER,
            pets: { "1": [1, 2], "2": [1], "3": "x" },
            items: { "1": { a: 1, b: -1 }, "2": "x" },
            supply: [{ kind: 1 }],
            crafts: { "1": [1, 0, 5], "2": [1, 0], "3": [1, -1, 5] },
            boards: { "1": [33, 0, 226, 1.5], "2": "x" },
        })

        expect(snapshot?.boards).toEqual({ "1": [33] })

        expect(snapshot?.pets).toEqual({ "1": [1, 2] })
        expect(snapshot?.items).toEqual({ "1": { a: 1 } })
        expect(snapshot?.supply).toEqual([])
        expect(snapshot?.crafts).toEqual({ "1": [1, 0, 5] })
    })

    it("rejects other versions and bad characters", () => {
        expect(parseGameSnapshot({ v: 2, character: CHARACTER })).toBeNull()
        expect(
            parseGameSnapshot({ v: 1, character: { ...CHARACTER, name: "" } }),
        ).toBeNull()
        expect(parseGameSnapshot("x")).toBeNull()
    })
})

describe("isGameKey", () => {
    it("matches the companion's keys only", () => {
        expect(isGameKey("daevanion:game:v1:1301:Testchar")).toBe(true)
        expect(isGameKey("daevanion:tracker:v1:data")).toBe(false)
    })
})

describe("getSnapshotTime", () => {
    it("is the newest section's time", () => {
        expect(
            getSnapshotTime({ character: CHARACTER, petsAt: 5, supplyAt: 9 }),
        ).toBe(9)
        expect(
            getSnapshotTime({ character: CHARACTER, petsAt: 5, craftsAt: 12 }),
        ).toBe(12)
        expect(getSnapshotTime({ character: CHARACTER })).toBe(0)
    })
})
