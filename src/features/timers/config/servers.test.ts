import { describe, expect, it } from "vitest"
import {
    DEFAULT_SERVER_ID,
    getFactionRegion,
    getPartner,
    getReportScope,
    getServer,
    getServerRegions,
    isServerId,
    SERVERS,
} from "./servers"
import { TIMERS } from "./timers"

const siel = getServer("siel")
const israphel = getServer("israphel")

describe("servers", () => {
    it("has 23 pairs with unique ids", () => {
        const ids = SERVERS.map((server) => server.id)

        expect(ids).toHaveLength(46)
        expect(new Set(ids).size).toBe(46)
    })

    it("recognises its ids", () => {
        expect(isServerId("siel")).toBe(true)
        expect(isServerId("Siel")).toBe(false)
        expect(isServerId(5)).toBe(false)
    })

    it("falls back to the default server", () => {
        expect(getServer("nowhere").id).toBe(DEFAULT_SERVER_ID)
    })

    it("finds the partner both ways", () => {
        expect(getPartner(siel).id).toBe("israphel")
        expect(getPartner(israphel).id).toBe("siel")
        expect(siel.faction).not.toBe(israphel.faction)
    })

    it("maps factions to their field boss region", () => {
        expect(getFactionRegion(siel)).toBe("verteron")
        expect(getFactionRegion(israphel)).toBe("altgard")
        expect(getServerRegions(israphel)).toEqual(["altgard", "abyss"])
    })

    it("scopes Abyss reports to the pair and others to the server", () => {
        expect(getReportScope(siel, "abyss")).toBe("siel-israphel")
        expect(getReportScope(israphel, "abyss")).toBe("siel-israphel")
        expect(getReportScope(siel, "verteron")).toBe("siel")
    })
})

describe("timer definitions", () => {
    it("have unique ids", () => {
        const ids = TIMERS.map((timer) => timer.id)

        expect(new Set(ids).size).toBe(ids.length)
    })

    it("have a way to know when they run", () => {
        for (const timer of TIMERS) {
            expect(Boolean(timer.boss || timer.schedule), timer.id).toBe(true)
        }
    })
})
