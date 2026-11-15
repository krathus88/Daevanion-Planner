import * as v from "valibot"
import { describe, expect, it } from "vitest"
import {
    entriesOf,
    finiteNumber,
    guarded,
    itemsOf,
    parseOrNull,
    parseStored,
    validEntries,
    validItems,
    wholeNumber,
} from "./schemas"

const isColor = (value: unknown): value is "red" | "blue" => {
    return value === "red" || value === "blue"
}

const isShortKey = (key: string): key is "a" | "b" => {
    return key === "a" || key === "b"
}

describe("wholeNumber", () => {
    it.each([0, 5, 10])("accepts %s within the range", (value) => {
        expect(v.is(wholeNumber(0, 10), value)).toBe(true)
    })

    it.each([-1, 11, 1.5, "3", Number.NaN])("rejects %s", (value) => {
        expect(v.is(wholeNumber(0, 10), value)).toBe(false)
    })

    it("has no upper limit unless given", () => {
        expect(v.is(wholeNumber(1), 1e12)).toBe(true)
    })
})

describe("finiteNumber", () => {
    it("rejects infinities", () => {
        expect(v.is(finiteNumber, 1.5)).toBe(true)
        expect(v.is(finiteNumber, Infinity)).toBe(false)
    })
})

describe("guarded", () => {
    it("checks with the given function", () => {
        expect(v.is(guarded(isColor), "red")).toBe(true)
        expect(v.is(guarded(isColor), "green")).toBe(false)
    })
})

describe("parseOrNull", () => {
    it("gives the output, or null when it doesn't fit", () => {
        expect(parseOrNull(v.string(), "x")).toBe("x")
        expect(parseOrNull(v.string(), 1)).toBeNull()
    })
})

describe("entriesOf", () => {
    it("drops bad entries one by one", () => {
        const schema = entriesOf(wholeNumber(0))

        expect(v.parse(schema, { a: 1, b: -1, c: "2", d: 3 })).toEqual({
            a: 1,
            d: 3,
        })
    })

    it("keeps only keys that pass the key check", () => {
        const schema = entriesOf(v.boolean(), isShortKey)

        expect(v.parse(schema, { a: true, b: false, c: true })).toEqual({
            a: true,
            b: false,
        })
    })

    it.each([[null], [[1]], ["x"], [1]])("fails for %j", (value) => {
        expect(v.is(entriesOf(v.number()), value)).toBe(false)
    })
})

describe("validEntries", () => {
    it.each([[null], [[1]], ["x"], [undefined]])("gives {} for %j", (value) => {
        expect(v.parse(validEntries(v.number()), value)).toEqual({})
    })

    it("gives {} for a missing field", () => {
        const schema = v.object({ counts: validEntries(v.number()) })

        expect(v.parse(schema, {})).toEqual({ counts: {} })
    })

    it("gives a new object each time", () => {
        const schema = validEntries(v.number())

        expect(v.parse(schema, null)).not.toBe(v.parse(schema, null))
    })

    it("drops an inner object that isn't one, when nested with entriesOf", () => {
        const schema = validEntries(entriesOf(v.number()))

        expect(
            v.parse(schema, { a: { x: 1 }, b: "no", c: { y: "no" } }),
        ).toEqual({ a: { x: 1 }, c: {} })
    })
})

describe("itemsOf", () => {
    it("drops bad items one by one", () => {
        expect(v.parse(itemsOf(v.string()), ["a", 1, "b", null])).toEqual([
            "a",
            "b",
        ])
    })

    it.each([[null], [{}], ["x"]])("fails for %j", (value) => {
        expect(v.is(itemsOf(v.string()), value)).toBe(false)
    })
})

describe("validItems", () => {
    it.each([[null], [{}], ["x"], [undefined]])("gives [] for %j", (value) => {
        expect(v.parse(validItems(v.string()), value)).toEqual([])
    })

    it("gives [] for a missing field", () => {
        const schema = v.object({ ids: validItems(v.string()) })

        expect(v.parse(schema, {})).toEqual({ ids: [] })
    })
})

describe("parseStored", () => {
    const schema = v.object({ count: wholeNumber(0) })
    const fallback = { count: 0 }

    it("reads JSON text that fits", () => {
        expect(parseStored(schema, '{"count":3}', fallback)).toEqual({
            count: 3,
        })
    })

    it.each([null, "not json", '{"count":-1}', "[]"])(
        "gives the fallback for %s",
        (raw) => {
            expect(parseStored(schema, raw, fallback)).toBe(fallback)
        },
    )
})
