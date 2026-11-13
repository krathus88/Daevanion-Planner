import { describe, expect, it } from "vitest"
import { keepUnchanged } from "./keepUnchanged"

describe("keepUnchanged", () => {
    it("hands back the old value when nothing changed", () => {
        const previous = { a: { b: [1, 2] }, c: "x" }
        const next = { a: { b: [1, 2] }, c: "x" }

        expect(keepUnchanged(previous, next)).toBe(previous)
    })

    it("keeps the unchanged parts and takes the changed ones", () => {
        const previous = {
            a: { b: 1 },
            c: { d: 1 },
            list: [{ x: 1 }, { x: 2 }],
        }
        const next = { a: { b: 1 }, c: { d: 2 }, list: [{ x: 1 }, { x: 3 }] }
        const kept = keepUnchanged(previous, next)

        expect(kept).toEqual(next)
        expect(kept).not.toBe(previous)
        expect(kept.a).toBe(previous.a)
        expect(kept.c).toBe(next.c)
        expect(kept.list).not.toBe(previous.list)
        expect(kept.list[0]).toBe(previous.list[0])
        expect(kept.list[1]).toBe(next.list[1])
    })

    it("counts added, removed and undefined keys as changes", () => {
        const previous: Record<string, number | undefined> = { a: 1 }

        expect(keepUnchanged(previous, { a: 1, b: undefined })).not.toBe(
            previous,
        )
        expect(keepUnchanged(previous, {})).not.toBe(previous)
        expect(keepUnchanged({ a: 1, b: 2 }, { a: 1 })).toEqual({ a: 1 })
    })

    it("counts a changed array length as a change", () => {
        const previous = [1, 2, 3]

        expect(keepUnchanged(previous, [1, 2])).toEqual([1, 2])
        expect(keepUnchanged(previous, [1, 2, 3, 4])).toEqual([1, 2, 3, 4])
    })

    it("ignores key order", () => {
        const previous = { a: 1, b: 2 }

        expect(keepUnchanged(previous, { b: 2, a: 1 })).toBe(previous)
    })

    it("never shares between arrays and objects or non-plain values", () => {
        const date = new Date(0)

        expect(keepUnchanged({ 0: 1 }, [1])).toEqual([1])
        expect(keepUnchanged(new Date(0), date)).toBe(date)
        expect(keepUnchanged(undefined, { a: 1 })).toEqual({ a: 1 })
    })
})
