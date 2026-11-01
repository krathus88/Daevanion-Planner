import { describe, expect, it } from "vitest"
import type { TimerId } from "@timers/config/timers"
import {
    addTimer,
    applyDrop,
    isPinned,
    removeTimer,
    type PinnedColumns,
} from "./pinnedColumns"

const A = "rift" as TimerId
const B = "shugo" as TimerId
const C = "siege" as TimerId
const D = "daily" as TimerId

describe("addTimer", () => {
    it("starts the first column", () => {
        expect(addTimer([], A)).toEqual([[A]])
    })

    it("fills the newest column up to two", () => {
        expect(addTimer([[A]], B)).toEqual([[A, B]])
    })

    it("opens a new column when the newest is full", () => {
        expect(addTimer([[A, B]], C)).toEqual([[A, B], [C]])
    })

    it("leaves older gaps alone", () => {
        expect(addTimer([[A], [B, C]], D)).toEqual([[A], [B, C], [D]])
    })

    it("does nothing for a timer already pinned", () => {
        const columns: PinnedColumns = [[A]]

        expect(addTimer(columns, A)).toBe(columns)
    })
})

describe("removeTimer", () => {
    it("keeps the rest of its column", () => {
        expect(removeTimer([[A, B]], A)).toEqual([[B]])
    })

    it("drops a column left empty", () => {
        expect(removeTimer([[A], [B]], A)).toEqual([[B]])
    })
})

describe("isPinned", () => {
    it("looks through every column", () => {
        expect(isPinned([[A], [B]], B)).toBe(true)
        expect(isPinned([[A], [B]], C)).toBe(false)
    })
})

describe("applyDrop", () => {
    it("swaps two timers", () => {
        expect(applyDrop([[A, B], [C]], A, { kind: "timer", id: C })).toEqual([
            [C, B],
            [A],
        ])
    })

    it("moves a timer into a column with room", () => {
        expect(
            applyDrop([[A, B], [C]], A, { kind: "column", index: 1 }),
        ).toEqual([[B], [C, A]])
    })

    it("finds the target column after the source one empties", () => {
        expect(applyDrop([[A], [B]], A, { kind: "column", index: 1 })).toEqual([
            [B, A],
        ])
    })

    it("refuses a full column", () => {
        const columns: PinnedColumns = [[A], [B, C]]

        expect(applyDrop(columns, A, { kind: "column", index: 1 })).toBe(
            columns,
        )
    })

    it("does nothing dropped on its own column", () => {
        const columns: PinnedColumns = [[A, B]]

        expect(applyDrop(columns, A, { kind: "column", index: 0 })).toBe(
            columns,
        )
    })

    it("gives a timer its own column in a gap", () => {
        expect(applyDrop([[A, B], [C]], A, { kind: "gap", index: 2 })).toEqual([
            [B],
            [C],
            [A],
        ])
    })

    it("shifts the gap when the source column disappears", () => {
        expect(
            applyDrop([[A], [B], [C]], A, { kind: "gap", index: 2 }),
        ).toEqual([[B], [A], [C]])
    })

    it("ignores a lone timer dropped beside itself", () => {
        const columns: PinnedColumns = [[A], [B]]

        expect(applyDrop(columns, A, { kind: "gap", index: 0 })).toBe(columns)
        expect(applyDrop(columns, A, { kind: "gap", index: 1 })).toBe(columns)
    })

    it("ignores a timer that isn't pinned", () => {
        const columns: PinnedColumns = [[A]]

        expect(applyDrop(columns, B, { kind: "gap", index: 0 })).toBe(columns)
    })
})
