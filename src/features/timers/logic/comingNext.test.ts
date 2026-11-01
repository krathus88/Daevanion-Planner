import { describe, expect, it } from "vitest"
import type { TimerDefinition, TimerId } from "@timers/config/timers"
import type { TimerEntry } from "@timers/hooks/useTimers"
import { getComingNext, isComingNextCount, isInComingNext } from "./comingNext"
import type { TimerState } from "./timerState"

const countdown = { estimated: false, afterMaintenance: false }

const entry = (name: string, state: TimerState, inComingNext = true) => {
    return {
        name: name,
        state: state,
        inComingNext: inComingNext,
    } as unknown as TimerEntry
}

const open = (at: number): TimerState => {
    return { status: "open", startedAt: 0, at: at, ...countdown }
}

const upcoming = (at: number): TimerState => {
    return { status: "upcoming", at: at, ...countdown }
}

const names = (entries: TimerEntry[]) => {
    return entries.map((item) => (item as unknown as { name: string }).name)
}

describe("isComingNextCount", () => {
    it.each([1, 4, 8])("accepts %d", (value) => {
        expect(isComingNextCount(value)).toBe(true)
    })

    it.each([0, 9, 1.5, "4", null])("rejects %s", (value) => {
        expect(isComingNextCount(value)).toBe(false)
    })
})

describe("isInComingNext", () => {
    const timer = (id: string, boss?: object) => {
        return { id: id, boss: boss } as unknown as TimerDefinition
    }

    it("includes events and resets by default", () => {
        expect(isInComingNext({}, timer("rift"))).toBe(true)
    })

    it("includes Abyss bosses and the default field bosses", () => {
        expect(isInComingNext({}, timer("x", { region: "abyss" }))).toBe(true)
        expect(
            isInComingNext({}, timer("gartua", { region: "verteron" })),
        ).toBe(true)
    })

    it("leaves other field bosses out", () => {
        expect(isInComingNext({}, timer("x", { region: "verteron" }))).toBe(
            false,
        )
    })

    it("lets the user override either way", () => {
        const overrides: Partial<Record<TimerId, boolean>> = {
            rift: false,
            gartua: true,
        }

        expect(isInComingNext(overrides, timer("rift"))).toBe(false)
    })
})

describe("getComingNext", () => {
    it("lists open timers by close, then upcoming by start", () => {
        const result = getComingNext(
            [
                entry("later", upcoming(50)),
                entry("closing later", open(40)),
                entry("soon", upcoming(10)),
                entry("closing soon", open(30)),
            ],
            10,
        )

        expect(names(result)).toEqual([
            "closing soon",
            "closing later",
            "soon",
            "later",
        ])
    })

    it("cuts the list at the count", () => {
        expect(
            names(
                getComingNext(
                    [entry("a", upcoming(1)), entry("b", upcoming(2))],
                    1,
                ),
            ),
        ).toEqual(["a"])
    })

    it("skips timers turned off, unset or killed", () => {
        expect(
            getComingNext(
                [
                    entry("off", upcoming(1), false),
                    entry("unset", { status: "unset" }),
                    entry("killed", { status: "killed", at: 1 }),
                ],
                10,
            ),
        ).toEqual([])
    })
})
