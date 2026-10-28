import type { PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas } from "@pets/data/petAtlas"
import {
    getBox,
    getNearPoints,
    getPatchGap,
    getPetPatches,
    isTouching,
    sharesGround,
} from "./farmPatches"
import { isPetNeeded, type FarmSpotPet } from "./farmSpots"
import { getMapPins, type PetMapSource, type SpotCount } from "./petFinder"
import { getPetLevel } from "./petLevels"

// The other pets to farm in each of an open pet's spots, most spawns there
// first.
export type SpotNeighbors = Map<SpotCount, FarmSpotPet[]>

// Other pets below Lv3, minus the levels hidden in the list's gear menu.
// The search and type filters are left out: they usually just found the
// open pet.
const getCandidates = (
    atlas: PetAtlas,
    pet: Pet,
    levels: Record<string, number>,
    hiddenLevels: number[],
) => {
    return atlas.pets.filter((other) => {
        return (
            other !== pet &&
            isPetNeeded(other, levels) &&
            !hiddenLevels.includes(getPetLevel(levels, other.id))
        )
    })
}

// A pet is there when one of its patches spawns on the spot's ground, the
// way Best spots merge; its spawns there are its pins near the spot's.
export const getSpotNeighbors = (
    atlas: PetAtlas,
    pet: Pet,
    sources: PetMapSource[],
    levels: Record<string, number>,
    hiddenLevels: number[],
) => {
    const candidates = getCandidates(atlas, pet, levels, hiddenLevels)
    const neighbors: SpotNeighbors = new Map()

    for (const source of sources) {
        const gap = getPatchGap(source.mapId)

        for (const spot of source.spots) {
            const box = getBox(spot.points)
            const found: FarmSpotPet[] = []

            for (const other of candidates) {
                const patches = getPetPatches(atlas, other, source.mapId)
                const there = patches.some((patch) => {
                    return (
                        isTouching(patch, box, gap) &&
                        sharesGround(patch.spawns, spot.points, gap)
                    )
                })

                if (!there) {
                    continue
                }

                const spawns = patches.flatMap((patch) => patch.spawns)

                found.push({
                    pet: other,
                    spawns: getNearPoints(spawns, spot.points, gap).length,
                })
            }

            neighbors.set(
                spot,
                found.sort((a, b) => b.spawns - a.spawns),
            )
        }
    }

    return neighbors
}

// The other pets' pins near a focused spot, named after it.
export const getNeighborPins = (
    atlas: PetAtlas,
    spot: SpotCount,
    neighbors: FarmSpotPet[],
    levels: Record<string, number>,
    mapId: PetMapId,
) => {
    const pins = getMapPins(
        atlas,
        neighbors.map((entry) => entry.pet),
        levels,
        mapId,
    )

    return getNearPoints(pins, spot.points, getPatchGap(mapId)).map((pin) => {
        return { ...pin, spot: spot.name }
    })
}
