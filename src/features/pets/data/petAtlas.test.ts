import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { PET_MAP_IDS } from "@pets/config/petMaps"
import { getFarmSpots } from "@pets/logic/farmSpots"
import { getPetMapSources } from "@pets/logic/petFinder"
import type { PetAtlas } from "./petAtlas"

// The data the site ships, read straight from the file: what the page fetches.
const atlas: PetAtlas = JSON.parse(
    readFileSync(new URL("./petAtlas.json", import.meta.url), "utf-8"),
)

describe("shipped pet data", () => {
    it("has pets and monsters", () => {
        expect(atlas.pets.length).toBeGreaterThan(0)
        expect(atlas.monsters.length).toBeGreaterThan(0)
    })

    it("has unique pet ids", () => {
        const ids = atlas.pets.map((pet) => pet.id)

        expect(new Set(ids).size).toBe(ids.length)
    })

    it("gives each monster to one pet at most", () => {
        const seen = new Set<number>()

        for (const pet of atlas.pets) {
            for (const index of pet.monsters) {
                expect(seen.has(index), `monster ${index}`).toBe(false)
                expect(atlas.monsters[index], `monster ${index}`).toBeDefined()
                seen.add(index)
            }
        }
    })

    it("stores spawns as x, y, spot triples pointing at real spots", () => {
        for (const monster of atlas.monsters) {
            expect(monster.spawns.length % 3, monster.name).toBe(0)

            const spots = atlas.spots[monster.map]

            for (let i = 2; i < monster.spawns.length; i += 3) {
                const spot = monster.spawns[i]

                expect(spot === -1 || spots[spot] !== undefined).toBe(true)
            }
        }
    })

    it("points each spot at a real area", () => {
        for (const mapId of PET_MAP_IDS) {
            for (const spot of atlas.spots[mapId]) {
                expect(
                    spot.area === -1 ||
                        atlas.areas[mapId][spot.area] !== undefined,
                    spot.name,
                ).toBe(true)
            }
        }
    })

    it("names each map's spots uniquely", () => {
        for (const mapId of PET_MAP_IDS) {
            const names = atlas.spots[mapId].map((spot) => spot.name)

            expect(new Set(names).size, mapId).toBe(names.length)
        }
    })

    it("gives field pets spawns, and accounts for every one of them", () => {
        for (const pet of atlas.pets) {
            const sources = getPetMapSources(atlas, pet)

            for (const source of sources) {
                let inSpots = 0

                for (const spot of source.spots) {
                    inSpots += spot.count
                }

                expect(inSpots, pet.name).toBe(source.count)
            }
        }
    })

    it.each(PET_MAP_IDS)("builds uniquely named Best spots on %s", (mapId) => {
        const { spots } = getFarmSpots(atlas, atlas.pets, {}, mapId)
        const names = spots.map((spot) => spot.name)

        expect(spots.length).toBeGreaterThan(0)
        expect(new Set(names).size).toBe(names.length)

        for (let index = 1; index < spots.length; index++) {
            expect(spots[index - 1].pets.length).toBeGreaterThanOrEqual(
                spots[index].pets.length,
            )
        }
    })
})
