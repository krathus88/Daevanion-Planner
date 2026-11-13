import { CLASS_IDS } from "@config/classPresets/classInfo"
import { describe, expect, it } from "vitest"
import { GAME_CLASSES, getServerId } from "./gameIds"

describe("GAME_CLASSES", () => {
    it("numbers every class once, 4 x its board index plus 2", () => {
        expect([...Object.values(GAME_CLASSES)].sort()).toEqual(
            [...CLASS_IDS].sort(),
        )
        expect(GAME_CLASSES[22]).toBe("spirit-master")
        expect(GAME_CLASSES[26]).toBe("sorcerer")
    })
})

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
