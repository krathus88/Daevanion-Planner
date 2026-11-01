import { describe, expect, it } from "vitest"
import { jsonEquals } from "./jsonEquals"

describe("jsonEquals", () => {
    it("ignores object key order", () => {
        expect(
            jsonEquals(
                { a: 1, b: { c: 2, d: 3 } },
                { b: { d: 3, c: 2 }, a: 1 },
            ),
        ).toBe(true)
    })

    it("respects array order", () => {
        expect(jsonEquals([1, 2], [2, 1])).toBe(false)
    })

    it.each([
        [{ a: 1 }, { a: 2 }],
        [{ a: 1 }, { b: 1 }],
        [{ a: 1 }, { a: 1, b: 2 }],
        [[1], [1, 2]],
        [[], {}],
        [null, {}],
        [1, "1"],
        [{ a: undefined }, { b: undefined }],
    ])("tells %j from %j", (a, b) => {
        expect(jsonEquals(a, b)).toBe(false)
    })

    it.each([[null], [1], ["x"], [true], [[]], [{}]])("matches %j", (value) => {
        expect(jsonEquals(value, value)).toBe(true)
    })
})
