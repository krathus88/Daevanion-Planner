import { describe, expect, it } from "vitest"
import { formatCount, formatKinah } from "./formatKinah"

describe("formatKinah", () => {
    it("groups whole Kinah and shows unknown as a dash", () => {
        expect(formatKinah(1250000.4)).toBe("1,250,000 Kinah")
        expect(formatKinah(null)).toBe("—")
        expect(formatCount(12345)).toBe("12,345")
    })
})
