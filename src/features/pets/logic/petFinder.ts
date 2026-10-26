import type { PetCategoryId } from "@pets/config/petCategories"
import { PET_MAP_IDS, PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas, PetMonster } from "@pets/data/petAtlas"
import { getPetLevel } from "./petLevels"
import { clusterSpawns, type SpotSpawn } from "./spotClusters"
import { getSpotArea, nameSpotGroup, type SpotLabels } from "./spotNames"

export type PetFilters = {
    query: string
    category: PetCategoryId | null
    // Pet Insight levels to leave out; locked pets always show.
    hiddenLevels: number[]
}

type CountedName = { name: string; count: number }

// A spot, the big area it lies in, and the soul monsters spawning there,
// most spawns first.
export type SpotCount = CountedName & {
    area: string | null
    monsters: (CountedName & { level: number })[]
}

export type SourceMonster = {
    name: string
    level: number
    rank: PetMonster["rank"]
    count: number
}

export type PetMapSource = {
    mapId: PetMapId
    count: number
    // The pet's own spots, so a patch the map's spots cut in two stays one.
    spots: SpotCount[]
    labels: SpotLabels
    monsters: SourceMonster[]
}

export type PetPin = {
    x: number
    y: number
    pet: Pet
    monster: PetMonster
    spot: string | null
    area: string | null
}

const SPAWN_STRIDE = 3

const getSpawnCount = (monster: PetMonster) => {
    return monster.spawns.length / SPAWN_STRIDE
}

const byCountThenName = (a: CountedName, b: CountedName) => {
    return b.count - a.count || a.name.localeCompare(b.name)
}

// Groups one pet's spawns on a map the way the map's spots were made, and
// names each group after the map spots it covers.
const getPetSpots = (
    atlas: PetAtlas,
    monsters: PetMonster[],
    mapId: PetMapId,
) => {
    const spawns: SpotSpawn[] = []
    const owners: { monster: PetMonster; index: number; spot: number }[] = []
    const labels: SpotLabels = new Map()

    for (const monster of monsters) {
        labels.set(monster, [])

        for (let i = 0; i < monster.spawns.length; i += SPAWN_STRIDE) {
            const spot = monster.spawns[i + 2]

            spawns.push({
                x: monster.spawns[i],
                y: monster.spawns[i + 1],
                area: atlas.spots[mapId][spot]?.area ?? -1,
                key: owners.length,
            })
            owners.push({
                monster: monster,
                index: i / SPAWN_STRIDE,
                spot: spot,
            })
        }
    }

    const spots: SpotCount[] = []
    const used = new Set<string>()

    for (const group of clusterSpawns(spawns, PET_MAPS[mapId].size)) {
        const named = nameSpotGroup(
            atlas,
            mapId,
            group.map((spawn) => owners[spawn.key].spot),
            used,
        )

        if (!named) {
            continue
        }

        // Two monsters can share a name at different levels.
        const monsterCounts = new Map<PetMonster, number>()

        for (const spawn of group) {
            const monster = owners[spawn.key].monster

            monsterCounts.set(monster, (monsterCounts.get(monster) ?? 0) + 1)
        }

        spots.push({
            name: named.name,
            area: named.area,
            count: group.length,
            monsters: [...monsterCounts]
                .map(([monster, count]) => {
                    return {
                        name: monster.name,
                        level: monster.level,
                        count: count,
                    }
                })
                .sort(byCountThenName),
        })

        for (const spawn of group) {
            const owner = owners[spawn.key]
            const monsterLabels = labels.get(owner.monster)

            if (monsterLabels) {
                monsterLabels[owner.index] = named.name
            }
        }
    }

    return { spots: spots.sort(byCountThenName), labels: labels }
}

// Typing a monster's name finds the pet it drops too.
const matchesQuery = (atlas: PetAtlas, pet: Pet, query: string) => {
    if (pet.name.toLowerCase().includes(query)) {
        return true
    }

    for (const index of pet.monsters) {
        if (atlas.monsters[index].name.toLowerCase().includes(query)) {
            return true
        }
    }

    return false
}

export const filterPets = (
    atlas: PetAtlas,
    filters: PetFilters,
    levels: Record<string, number>,
) => {
    const query = filters.query.trim().toLowerCase()
    const pets: Pet[] = []

    for (const pet of atlas.pets) {
        if (filters.category && pet.category !== filters.category) {
            continue
        }

        if (filters.hiddenLevels.includes(getPetLevel(levels, pet.id))) {
            continue
        }

        if (query && !matchesQuery(atlas, pet, query)) {
            continue
        }

        pets.push(pet)
    }

    return pets
}

export const getPetMapCounts = (atlas: PetAtlas, pet: Pet) => {
    const counts: Partial<Record<PetMapId, number>> = {}

    for (const index of pet.monsters) {
        const monster = atlas.monsters[index]

        counts[monster.map] =
            (counts[monster.map] ?? 0) + getSpawnCount(monster)
    }

    return counts
}

export const getMapCounts = (atlas: PetAtlas, pets: Pet[]) => {
    const counts: Partial<Record<PetMapId, number>> = {}

    for (const pet of pets) {
        for (const [mapId, count] of Object.entries(
            getPetMapCounts(atlas, pet),
        )) {
            const id = mapId as PetMapId

            counts[id] = (counts[id] ?? 0) + count
        }
    }

    return counts
}

// Maps that have the pet, most spawns first.
export const getPetMapSources = (atlas: PetAtlas, pet: Pet) => {
    const sources: PetMapSource[] = []

    for (const mapId of PET_MAP_IDS) {
        const mapMonsters: PetMonster[] = []
        const monsters: SourceMonster[] = []
        let count = 0

        for (const index of pet.monsters) {
            const monster = atlas.monsters[index]

            if (monster.map !== mapId || monster.spawns.length === 0) {
                continue
            }

            const spawns = getSpawnCount(monster)

            count += spawns
            mapMonsters.push(monster)
            monsters.push({
                name: monster.name,
                level: monster.level,
                rank: monster.rank,
                count: spawns,
            })
        }

        if (count === 0) {
            continue
        }

        const petSpots = getPetSpots(atlas, mapMonsters, mapId)

        sources.push({
            mapId: mapId,
            count: count,
            spots: petSpots.spots,
            labels: petSpots.labels,
            monsters: monsters.sort(byCountThenName),
        })
    }

    return sources.sort((a, b) => b.count - a.count)
}

// labels: spot names to show instead of the map's own, from an open pet's
// spots (PetMapSource.labels) or the Best spots (getFarmSpots).
export const getMapPins = (
    atlas: PetAtlas,
    pets: Pet[],
    mapId: PetMapId,
    labels?: SpotLabels,
) => {
    const pins: PetPin[] = []

    for (const pet of pets) {
        for (const index of pet.monsters) {
            const monster = atlas.monsters[index]

            if (monster.map !== mapId) {
                continue
            }

            for (let i = 0; i < monster.spawns.length; i += SPAWN_STRIDE) {
                const label = labels?.get(monster)?.[i / SPAWN_STRIDE]

                pins.push({
                    x: monster.spawns[i],
                    y: monster.spawns[i + 1],
                    pet: pet,
                    monster: monster,
                    spot:
                        label ??
                        atlas.spots[mapId][monster.spawns[i + 2]]?.name ??
                        null,
                    area: getSpotArea(atlas, mapId, monster.spawns[i + 2]),
                })
            }
        }
    }

    return pins
}
