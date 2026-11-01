import { describe, expect, it } from "vitest"
import { isRecord } from "./isRecord"

describe("isRecord", () => {
    it("accepts objects", () => {
        expect(isRecord({})).toBe(true)
        expect(isRecord({ a: 1 })).toBe(true)
    })

    it.each([null, undefined, 1, "x", true])("rejects %s", (value) => {
        expect(isRecord(value)).toBe(false)
    })

    it("rejects arrays", () => {
        expect(isRecord([])).toBe(false)
    })
})
