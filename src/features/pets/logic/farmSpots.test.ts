import { describe, expect, it } from "vitest"
import type { PetCategoryId } from "@pets/config/petCategories"
import { makeAtlas, makeMonster, namedSpots, spawnsAt } from "@test/petFixture"
import {
    getBox,
    getNearPoints,
    getPatchGap,
    getPetPatches,
    isTouching,
    mergePatches,
    sharesGround,
} from "./farmPatches"
import {
    filterFarmSpots,
    getFarmSpots,
    isPetNeeded,
    type FarmSpot,
} from "./farmSpots"

describe("geometry helpers", () => {
    it("getBox wraps the points", () => {
        expect(
            getBox([
                { x: 1, y: 5 },
                { x: 3, y: 2 },
            ]),
        ).toEqual({ left: 1, top: 2, right: 3, bottom: 5 })
    })

    it("isTouching counts boxes within the gap of each other", () => {
        const a = { left: 0, top: 0, right: 10, bottom: 10 }
        const b = { left: 30, top: 0, right: 40, bottom: 10 }

        expect(isTouching(a, b, 10)).toBe(true)
        expect(isTouching(a, b, 9)).toBe(false)
    })

    it("getNearPoints finds points with a neighbor in range", () => {
        const near = { x: 0, y: 0 }
        const far = { x: 500, y: 0 }

        expect(getNearPoints([near, far], [{ x: 50, y: 0 }], 60)).toEqual([
            near,
        ])
    })

    it("getNearPoints looks across grid cells", () => {
        expect(
            getNearPoints([{ x: 59, y: 59 }], [{ x: 61, y: 61 }], 60),
        ).toHaveLength(1)
    })

    it("sharesGround needs half of the smaller side near the other", () => {
        const large = [
            { x: 0, y: 0 },
            { x: 1, y: 0 },
            { x: 2, y: 0 },
        ]

        expect(
            sharesGround(
                [
                    { x: 0, y: 1 },
                    { x: 900, y: 0 },
                ],
                large,
                60,
            ),
        ).toBe(true)
        expect(
            sharesGround(
                [
                    { x: 0, y: 1 },
                    { x: 900, y: 0 },
                    { x: 950, y: 0 },
                ],
                large,
                60,
            ),
        ).toBe(false)
    })

    it("scales the gap with the map", () => {
        expect(getPatchGap("verteron")).toBeCloseTo(8192 / 136)
        expect(getPatchGap("reshanta")).toBeCloseTo(4096 / 136)
    })
})

describe("getPetPatches", () => {
    it("groups one pet's pins on that map, with a box", () => {
        const atlas = makeAtlas([
            {
                monsters: [
                    makeMonster(spawnsAt(0, 0, 16)),
                    makeMonster(spawnsAt(4000, 4000, 16)),
                    makeMonster(spawnsAt(0, 0, 16), { map: "altgard" }),
                ],
            },
        ])
        const patches = getPetPatches(atlas, atlas.pets[0], "verteron")

        expect(patches).toHaveLength(2)

        for (const patch of patches) {
            expect(patch.spawns).toHaveLength(16)
            expect(patch.right - patch.left).toBe(30)
        }
    })

    it("works each pet out once", () => {
        const atlas = makeAtlas([
            { monsters: [makeMonster(spawnsAt(0, 0, 16))] },
        ])

        expect(getPetPatches(atlas, atlas.pets[0], "verteron")).toBe(
            getPetPatches(atlas, atlas.pets[0], "verteron"),
        )
    })
})

describe("mergePatches", () => {
    const patchesOf = (spawnLists: number[][]) => {
        const atlas = makeAtlas(
            spawnLists.map((spawns) => {
                return { monsters: [makeMonster(spawns)] }
            }),
        )

        return atlas.pets.flatMap((pet) => {
            return getPetPatches(atlas, pet, "verteron")
        })
    }

    it("merges pets on the same ground", () => {
        const groups = mergePatches(
            patchesOf([spawnsAt(0, 0, 16), spawnsAt(5, 5, 16)]),
            "verteron",
        )

        expect(groups).toHaveLength(1)
        expect(groups[0]).toHaveLength(2)
    })

    it("keeps pets far apart separate", () => {
        expect(
            mergePatches(
                patchesOf([spawnsAt(0, 0, 16), spawnsAt(4000, 0, 16)]),
                "verteron",
            ),
        ).toHaveLength(2)
    })

    it("doesn't let a merged spot grow too wide", () => {
        // Two far groups that a wide pet spreads between: it can't chain them.
        const groups = mergePatches(
            patchesOf([
                spawnsAt(0, 0, 16),
                spawnsAt(350, 0, 16),
                [...spawnsAt(40, 0, 9), ...spawnsAt(310, 0, 9)],
            ]),
            "verteron",
        )
        const allThree = groups.some((group) => group.length === 3)

        expect(allThree).toBe(false)
    })

    it("keeps every patch once", () => {
        const patches = patchesOf([
            spawnsAt(0, 0, 16),
            spawnsAt(5, 5, 16),
            spawnsAt(4000, 0, 16),
        ])
        const merged = mergePatches(patches, "verteron").flat()

        expect(merged).toHaveLength(patches.length)
        expect(new Set(merged).size).toBe(patches.length)
    })

    it("handles no patches", () => {
        expect(mergePatches([], "verteron")).toEqual([])
    })
})

describe("isPetNeeded", () => {
    const atlas = makeAtlas([{}])
    const [pet] = atlas.pets

    it("counts pets below Lv3", () => {
        expect(isPetNeeded(pet, {})).toBe(true)
        expect(isPetNeeded(pet, { [pet.id]: 2 })).toBe(true)
        expect(isPetNeeded(pet, { [pet.id]: 3 })).toBe(false)
    })
})

describe("getFarmSpots", () => {
    const build = () => {
        return makeAtlas(
            [
                {
                    monsters: [
                        makeMonster(spawnsAt(0, 0, 16, 0), { level: 5 }),
                    ],
                },
                {
                    monsters: [
                        makeMonster(spawnsAt(5, 5, 16, 0), { level: 9 }),
                    ],
                },
                { monsters: [makeMonster(spawnsAt(4000, 0, 49, 1))] },
            ],
            { spots: namedSpots("verteron", ["Shared", "Lonely"]) },
        )
    }

    it("ranks by how many pets spawn there, then spawns", () => {
        const atlas = build()
        const { spots } = getFarmSpots(atlas, atlas.pets, {}, "verteron")

        expect(spots.map((spot) => spot.name)).toEqual(["Shared", "Lonely"])
        expect(spots[0].pets).toHaveLength(2)
        expect(spots[0].spawns).toBe(32)
    })

    it("reports the level range", () => {
        const atlas = build()
        const [spot] = getFarmSpots(atlas, atlas.pets, {}, "verteron").spots

        expect(spot.minLevel).toBe(5)
        expect(spot.maxLevel).toBe(9)
    })

    it("leaves out pets already at Lv3", () => {
        const atlas = build()
        const levels = {
            [atlas.pets[0].id]: 3,
            [atlas.pets[1].id]: 3,
        }
        const { spots } = getFarmSpots(atlas, atlas.pets, levels, "verteron")

        expect(spots.map((spot) => spot.name)).toEqual(["Lonely"])
    })

    it("labels each spawn with its spot for the map pins", () => {
        const atlas = build()
        const { labels } = getFarmSpots(atlas, atlas.pets, {}, "verteron")

        expect(labels.get(atlas.monsters[2])?.[0]).toBe("Lonely")
    })

    it("is empty on a map with no spawns", () => {
        const atlas = build()

        expect(getFarmSpots(atlas, atlas.pets, {}, "altgard").spots).toEqual([])
    })

    it("reuses the last result for the same objects", () => {
        const atlas = build()
        const levels = {}
        const first = getFarmSpots(atlas, atlas.pets, levels, "verteron")

        expect(getFarmSpots(atlas, atlas.pets, levels, "verteron")).toBe(first)
        expect(getFarmSpots(atlas, atlas.pets, {}, "verteron")).not.toBe(first)
    })
})

describe("filterFarmSpots", () => {
    const CAT_A = "a" as PetCategoryId
    const CAT_B = "b" as PetCategoryId

    const spot = (name: string, categories: PetCategoryId[]) => {
        return {
            name: name,
            pets: categories.map((category) => {
                return { pet: { category: category }, spawns: 1 }
            }),
        } as unknown as FarmSpot
    }

    it("returns the same list with nothing required", () => {
        const spots = [spot("x", [CAT_A])]

        expect(filterFarmSpots(spots, [])).toBe(spots)
    })

    it("keeps spots with every required type", () => {
        const spots = [spot("both", [CAT_A, CAT_B]), spot("one", [CAT_A])]

        expect(
            filterFarmSpots(spots, [CAT_A, CAT_B]).map((item) => item.name),
        ).toEqual(["both"])
    })

    it("moves pets of the required types first", () => {
        const [filtered] = filterFarmSpots([spot("x", [CAT_A, CAT_B])], [CAT_B])

        expect(filtered.pets[0].pet.category).toBe(CAT_B)
    })
})
