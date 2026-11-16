// @vitest-environment jsdom
import { describe, expect, it } from "vitest"
import {
    getSharpestZoom,
    getTileUrl,
    OVERVIEW_ZOOMS,
    PET_MAP_IDS,
} from "@pets/config/petMaps"
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

describe("map tiles", () => {
    it("serves our own copies below full size", () => {
        expect(getTileUrl("reshanta", -2, 1, 0)).toMatch(
            /pet-maps\/Abyss_Reshanta_A\/-2\/1_0\.webp$/,
        )
    })

    it("links full-size tiles from the Interactive Map", () => {
        expect(getTileUrl("reshanta", 0, 1, 2)).toMatch(
            /^https:\/\/aion2-interactive-map\.github\.io\/.*Abyss_Reshanta_A_01_02\.webp$/,
        )
    })

    it("is full size at best, but for a map with other art", () => {
        expect(getSharpestZoom("verteron")).toBe(0)
        expect(getSharpestZoom("outerReshanta")).toBe(-1)
    })

    it("never needs a tile we don't have", () => {
        for (const mapId of PET_MAP_IDS) {
            expect(OVERVIEW_ZOOMS, mapId).toContain(
                Math.min(getSharpestZoom(mapId), -1),
            )
        }
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
