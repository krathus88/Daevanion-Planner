import { describe, expect, it } from "vitest"
import { formatPower } from "./gearScore"

describe("formatPower", () => {
    it("shows thousands with one decimal, cut like the game", () => {
        expect(formatPower(183566)).toBe("183.5k")
        expect(formatPower(153162)).toBe("153.1k")
        expect(formatPower(120000)).toBe("120.0k")
    })

    it("shows small scores whole", () => {
        expect(formatPower(999)).toBe("999")
    })
})
