import { describe, expect, it } from "vitest"
import { makeAtlas, makeMonster, spawnsAt } from "@test/petFixture"
import { getPetMapSources } from "./petFinder"
import { getNeighborPins, getSpotNeighbors } from "./spotNeighbors"

const build = () => {
    const atlas = makeAtlas([
        { name: "Open", monsters: [makeMonster(spawnsAt(0, 0, 16))] },
        { name: "Near", monsters: [makeMonster(spawnsAt(5, 5, 16))] },
        { name: "Nearer", monsters: [makeMonster(spawnsAt(5, 5, 25))] },
        { name: "Far", monsters: [makeMonster(spawnsAt(4000, 0, 16))] },
    ])
    const [open] = atlas.pets

    return {
        atlas: atlas,
        open: open,
        sources: getPetMapSources(atlas, open),
    }
}

describe("getSpotNeighbors", () => {
    it("lists other pets on the spot's ground, most spawns first", () => {
        const { atlas, open, sources } = build()
        const neighbors = getSpotNeighbors(atlas, open, sources, {}, [])
        const found = neighbors.get(sources[0].spots[0]) ?? []

        expect(found.map((entry) => entry.pet.name)).toEqual(["Nearer", "Near"])
    })

    it("leaves out the open pet and pets at Lv3", () => {
        const { atlas, open, sources } = build()
        const near = atlas.pets[1]
        const neighbors = getSpotNeighbors(
            atlas,
            open,
            sources,
            { [near.id]: 3 },
            [],
        )
        const found = neighbors.get(sources[0].spots[0]) ?? []

        expect(found.map((entry) => entry.pet.name)).toEqual(["Nearer"])
    })

    it("leaves out levels hidden in the gear menu", () => {
        const { atlas, open, sources } = build()
        const near = atlas.pets[1]
        const neighbors = getSpotNeighbors(
            atlas,
            open,
            sources,
            { [near.id]: 2 },
            [2],
        )

        expect(
            (neighbors.get(sources[0].spots[0]) ?? []).map(
                (entry) => entry.pet.name,
            ),
        ).toEqual(["Nearer"])
    })
})

describe("getNeighborPins", () => {
    it("gives only pins near the spot, named after it", () => {
        const { atlas, open, sources } = build()
        const spot = sources[0].spots[0]
        const found =
            getSpotNeighbors(atlas, open, sources, {}, []).get(spot) ?? []
        const pins = getNeighborPins(atlas, spot, found, {}, "verteron")

        expect(pins).toHaveLength(41)

        for (const pin of pins) {
            expect(pin.spot).toBe(spot.name)
        }
    })

    it("is empty without neighbors", () => {
        const { atlas, sources } = build()

        expect(
            getNeighborPins(atlas, sources[0].spots[0], [], {}, "verteron"),
        ).toEqual([])
    })
})
