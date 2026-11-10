import { describe, expect, it } from "vitest"
import { afterTax } from "./marketTax"

describe("afterTax", () => {
    it("takes the 10% Market tax off a sale", () => {
        expect(afterTax(200)).toBe(180)
    })
})
