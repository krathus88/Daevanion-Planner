import { describe, expect, it } from "vitest"
import type { PetCategoryId } from "@pets/config/petCategories"
import { makeAtlas, makeMonster, namedSpots, spawnsAt } from "@test/petFixture"
import {
    filterPets,
    getMapCounts,
    getMapPins,
    getMostSpawnsMap,
    getPetMapCounts,
    getPetMapSources,
    type PetMapSource,
} from "./petFinder"

const noFilters = { query: "", category: null, hiddenLevels: [] }
const CAT_A = "a" as PetCategoryId
const CAT_B = "b" as PetCategoryId

describe("filterPets", () => {
    const atlas = makeAtlas([
        {
            name: "Fire Fox",
            category: CAT_A,
            monsters: [makeMonster([], { name: "Ember Wolf" })],
        },
        { name: "Ice Bear", category: CAT_B },
    ])
    const [fox, bear] = atlas.pets

    const names = (filters: object, levels: Record<string, number> = {}) => {
        return filterPets(atlas, { ...noFilters, ...filters }, levels).map(
            (pet) => pet.name,
        )
    }

    it("keeps everything with no filters", () => {
        expect(names({})).toEqual(["Fire Fox", "Ice Bear"])
    })

    it("searches pet names, ignoring case and spaces", () => {
        expect(names({ query: "  fire " })).toEqual(["Fire Fox"])
    })

    it("searches the names of the monsters it drops from", () => {
        expect(names({ query: "ember" })).toEqual(["Fire Fox"])
    })

    it("filters by category", () => {
        expect(names({ category: CAT_B })).toEqual(["Ice Bear"])
    })

    it("hides chosen levels", () => {
        expect(names({ hiddenLevels: [2] }, { [fox.id]: 2 })).toEqual([
            "Ice Bear",
        ])
    })

    it("can hide locked pets, counted as level 0", () => {
        expect(names({ hiddenLevels: [0] }, { [bear.id]: 1 })).toEqual([
            "Ice Bear",
        ])
    })

    it("combines filters", () => {
        expect(names({ query: "fire", category: CAT_B })).toEqual([])
    })
})

describe("map counts", () => {
    const atlas = makeAtlas([
        {
            monsters: [
                makeMonster(spawnsAt(0, 0, 3)),
                makeMonster(spawnsAt(0, 0, 2)),
                makeMonster(spawnsAt(0, 0, 4), { map: "altgard" }),
            ],
        },
        { monsters: [makeMonster(spawnsAt(0, 0, 1))] },
    ])

    it("adds up a pet's spawns per map", () => {
        expect(getPetMapCounts(atlas, atlas.pets[0])).toEqual({
            verteron: 5,
            altgard: 4,
        })
    })

    it("adds up several pets", () => {
        expect(getMapCounts(atlas, atlas.pets)).toEqual({
            verteron: 6,
            altgard: 4,
        })
    })
})

describe("getPetMapSources", () => {
    it("lists only maps with spawns, in map order", () => {
        const atlas = makeAtlas([
            {
                monsters: [
                    makeMonster(spawnsAt(0, 0, 20), { map: "altgard" }),
                    makeMonster(spawnsAt(0, 0, 3), { map: "verteron" }),
                    makeMonster([], { map: "reshanta" }),
                ],
            },
        ])
        const sources = getPetMapSources(atlas, atlas.pets[0])

        expect(sources.map((source) => source.mapId)).toEqual([
            "verteron",
            "altgard",
        ])
    })

    it("is empty for a pet with no spawns", () => {
        const atlas = makeAtlas([{ source: "other" }])

        expect(getPetMapSources(atlas, atlas.pets[0])).toEqual([])
    })

    it("sorts monsters by spawns, then name", () => {
        const atlas = makeAtlas([
            {
                monsters: [
                    makeMonster(spawnsAt(0, 0, 2), { name: "Zed" }),
                    makeMonster(spawnsAt(30, 0, 2), { name: "Abe" }),
                    makeMonster(spawnsAt(60, 0, 5), { name: "Max" }),
                ],
            },
        ])
        const [source] = getPetMapSources(atlas, atlas.pets[0])

        expect(source.count).toBe(9)
        expect(source.monsters.map((monster) => monster.name)).toEqual([
            "Max",
            "Abe",
            "Zed",
        ])
    })

    it("groups the pet's own spawns into spots, biggest first", () => {
        const atlas = makeAtlas(
            [
                {
                    monsters: [
                        makeMonster([
                            ...spawnsAt(0, 0, 12, 0),
                            ...spawnsAt(4000, 4000, 20, 1),
                        ]),
                    ],
                },
            ],
            { spots: namedSpots("verteron", ["Small", "Big"]) },
        )
        const [source] = getPetMapSources(atlas, atlas.pets[0])

        expect(source.spots.map((spot) => [spot.name, spot.count])).toEqual([
            ["Big", 20],
            ["Small", 12],
        ])
        expect(source.spots[0].points).toHaveLength(20)
    })

    it("labels each spawn with its spot's name", () => {
        const monster = makeMonster([
            ...spawnsAt(0, 0, 12, 0),
            ...spawnsAt(4000, 4000, 12, 1),
        ])
        const atlas = makeAtlas([{ monsters: [monster] }], {
            spots: namedSpots("verteron", ["West", "East"]),
        })
        const [source] = getPetMapSources(atlas, atlas.pets[0])
        const labels = source.labels.get(atlas.monsters[0])

        expect(labels).toHaveLength(24)
        expect(labels?.[0]).toBe("West")
        expect(labels?.[23]).toBe("East")
    })

    it("counts monsters in a spot separately by level", () => {
        const atlas = makeAtlas([
            {
                monsters: [
                    makeMonster(spawnsAt(0, 0, 6), { name: "Wolf", level: 1 }),
                    makeMonster(spawnsAt(100, 0, 6), {
                        name: "Wolf",
                        level: 9,
                    }),
                ],
            },
        ])
        const [source] = getPetMapSources(atlas, atlas.pets[0])

        expect(source.spots[0].monsters).toHaveLength(2)
    })
})

describe("getMostSpawnsMap", () => {
    const source = (mapId: string, count: number) => {
        return { mapId: mapId, count: count } as unknown as PetMapSource
    }

    it("picks the most spawns", () => {
        expect(
            getMostSpawnsMap([source("verteron", 1), source("altgard", 5)]),
        ).toBe("altgard")
    })

    it("picks the first map on a tie", () => {
        expect(
            getMostSpawnsMap([source("verteron", 5), source("altgard", 5)]),
        ).toBe("verteron")
    })

    it("is undefined with no sources", () => {
        expect(getMostSpawnsMap([])).toBeUndefined()
    })
})

describe("getMapPins", () => {
    const atlas = makeAtlas(
        [
            {
                monsters: [
                    makeMonster([1, 2, 0, 3, 4, -1]),
                    makeMonster([5, 6, -1], { map: "altgard" }),
                ],
            },
        ],
        {
            areas: { verteron: ["Area"], reshanta: [], altgard: [] },
            spots: namedSpots("verteron", ["Spot"], 0),
        },
    )
    const [pet] = atlas.pets

    it("makes a pin per spawn on that map only", () => {
        const pins = getMapPins(atlas, [pet], { [pet.id]: 2 }, "verteron")

        expect(pins).toHaveLength(2)
        expect(pins[0]).toMatchObject({
            x: 1,
            y: 2,
            spot: "Spot",
            area: "Area",
            level: 2,
            pet: pet,
        })
    })

    it("has no spot for a spawn outside the map's spots", () => {
        const pins = getMapPins(atlas, [pet], {}, "verteron")

        expect(pins[1]).toMatchObject({ spot: null, area: null, level: 0 })
    })

    it("prefers given labels", () => {
        const labels = new Map([[atlas.monsters[0], ["Mine", null]]])
        const pins = getMapPins(atlas, [pet], {}, "verteron", labels)

        expect(pins[0].spot).toBe("Mine")
        expect(pins[1].spot).toBeNull()
    })
})
