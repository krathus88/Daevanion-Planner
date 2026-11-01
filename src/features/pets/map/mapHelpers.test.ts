// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import type { PetPin } from "@pets/logic/petFinder"
import { getMapBounds, toLatLng } from "./mapCoords"
import { buildPinTooltip } from "./pinTooltip"

describe("map coordinates", () => {
    it("flips y for Leaflet", () => {
        const point = toLatLng(100, 200)

        expect(point.lat).toBe(-200)
        expect(point.lng).toBe(100)
    })

    it("bounds a map by its size", () => {
        const bounds = getMapBounds("reshanta")

        expect(bounds.getNorth()).toBeCloseTo(0)
        expect(bounds.getWest()).toBeCloseTo(0)
        expect(bounds.getSouth()).toBe(-4096)
        expect(bounds.getEast()).toBe(4096)
    })
})

describe("buildPinTooltip", () => {
    const pin = (overrides: object = {}) => {
        return {
            pet: { name: "Fox" },
            monster: { name: "Wolf", level: 12 },
            spot: "Ruins",
            area: "Big Area",
            level: 2,
            ...overrides,
        } as unknown as PetPin
    }

    it("shows the pet, monster and place", () => {
        const tooltip = buildPinTooltip(pin())

        expect(tooltip.querySelector("strong")?.textContent).toBe("Fox")
        expect(tooltip.textContent).toContain("Wolf · Lv12")
        expect(tooltip.textContent).toContain("Ruins · Big Area")
    })

    it("leaves out a missing place", () => {
        const onlySpot = buildPinTooltip(pin({ area: null }))
        const none = buildPinTooltip(pin({ spot: null, area: null }))

        expect(onlySpot.textContent).toContain("Ruins")
        expect(onlySpot.textContent).not.toContain("·  ")
        expect(none.textContent).not.toContain("Ruins")
    })

    it("labels the level, for its color too", () => {
        const level = buildPinTooltip(pin()).querySelector(".pet-tooltip-level")

        expect(level?.textContent).toBe("Lv2")
        expect((level as HTMLElement).dataset.level).toBe("2")
    })

    it("calls level 0 locked", () => {
        expect(
            buildPinTooltip(pin({ level: 0 })).querySelector(
                ".pet-tooltip-level",
            )?.textContent,
        ).toBe("Locked")
    })

    it("has no image for a pet without a portrait", () => {
        expect(buildPinTooltip(pin()).querySelector("img")).toBeNull()
    })

    it("keeps names as text, never as markup", () => {
        const tooltip = buildPinTooltip(
            pin({ pet: { name: "<img src=x>" }, spot: null, area: null }),
        )

        expect(tooltip.querySelector("img")).toBeNull()
        expect(tooltip.querySelector("strong")?.textContent).toBe("<img src=x>")
    })
})
