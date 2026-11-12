import { describe, expect, it } from "vitest"
import { getServerId } from "./gameIds"

describe("getServerId", () => {
    it("numbers servers by pair, Elyos from 1301 and Asmodians from 2301", () => {
        expect(getServerId(1301)).toBe("siel")
        expect(getServerId(2301)).toBe("israphel")
        expect(getServerId(1302)).toBe("nezekan")
        expect(getServerId(2302)).toBe("zikel")
        expect(getServerId(1323)).toBe("nathara")
        expect(getServerId(2323)).toBe("tassin")
    })

    it("knows no other numbers", () => {
        expect(getServerId(1324)).toBeNull()
        expect(getServerId(0)).toBeNull()
    })
})
