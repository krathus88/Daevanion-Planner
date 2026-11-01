import { describe, expect, it } from "vitest"
import { makeAtlas } from "@test/petFixture"
import { getSpotArea, nameSpotGroup } from "./spotNames"

const atlas = makeAtlas([], {
    areas: { verteron: ["Big Area"], reshanta: [], altgard: [] },
    spots: {
        verteron: [
            { name: "Ruins (south)", area: 0 },
            { name: "Ruins (north)", area: 0 },
            { name: "Lake", area: -1 },
        ],
        reshanta: [],
        altgard: [],
    },
})

const center = { x: 0, y: 0 }

const name = (indexes: number[], used = new Set<string>()) => {
    return nameSpotGroup(atlas, "verteron", indexes, center, used).name
}

describe("getSpotArea", () => {
    it("finds the spot's area", () => {
        expect(getSpotArea(atlas, "verteron", 0)).toBe("Big Area")
    })

    it("is null for no spot or no area", () => {
        expect(getSpotArea(atlas, "verteron", -1)).toBeNull()
        expect(getSpotArea(atlas, "verteron", 2)).toBeNull()
    })
})

describe("nameSpotGroup: named spots", () => {
    it("takes the spot most of the group is in", () => {
        expect(name([2, 2, 0])).toBe("Lake")
    })

    it("drops the side when the group covers just one landmark", () => {
        expect(name([0, 1])).toBe("Ruins")
    })

    it("keeps the side when the base name is taken", () => {
        expect(name([0, 0, 1], new Set(["Ruins"]))).toBe("Ruins (south)")
    })

    it("breaks a tie between spots by name", () => {
        expect(name([0, 1], new Set(["Ruins"]))).toBe("Ruins (north)")
    })

    it("moves to the group's next spot when its main name is taken", () => {
        expect(name([2, 2, 0], new Set(["Lake"]))).toBe("Ruins (south)")
    })

    it("numbers the name when all of them are taken", () => {
        expect(name([2], new Set(["Lake"]))).toBe("Lake 2")
        expect(name([2], new Set(["Lake", "Lake 2"]))).toBe("Lake 3")
    })

    it("claims the name it gives", () => {
        const used = new Set<string>()

        expect(name([2], used)).toBe("Lake")
        expect(name([2], used)).toBe("Lake 2")
    })

    it("returns the main spot's area", () => {
        expect(
            nameSpotGroup(atlas, "verteron", [0], center, new Set()).area,
        ).toBe("Big Area")
    })
})

describe("nameSpotGroup: by position", () => {
    // Lower Reshanta: 4096 wide, so the middle is 2048.
    const at = (x: number, y: number, used = new Set<string>()) => {
        return nameSpotGroup(atlas, "reshanta", [-1], { x: x, y: y }, used)
    }

    it.each([
        [4000, 2048, "east"],
        [100, 2048, "west"],
        [2048, 100, "north"],
        [2048, 4000, "south"],
        [4000, 100, "northeast"],
        [100, 4000, "southwest"],
        [2048, 2048, "central"],
    ])("names (%d, %d) %s", (x, y, side) => {
        expect(at(x, y).name).toBe(`Lower Reshanta (${side})`)
    })

    it("has no area", () => {
        expect(at(0, 0).area).toBeNull()
    })

    it("numbers repeats", () => {
        const used = new Set<string>()

        at(4000, 2048, used)

        expect(at(4000, 2048, used).name).toBe("Lower Reshanta (east 2)")
    })
})
