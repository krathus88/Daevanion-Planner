import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas, PetMonster } from "@pets/data/petAtlas"
import { clusterSpawns, type SpotSpawn } from "./spotClusters"

// Map spot index per spawn of each monster, -1 for none.
type FarmSpotIndexes = Map<PetMonster, number[]>

const SPAWN_STRIDE = 3

// The map's spots are cut from every pet's pins together, so a cut can leave
// a spawn or two of one pet's patch in the next spot. Here each pet's own
// pins are grouped the same way and every group counts in the one map spot
// most of it lies in, so a patch never shows up as a 1-spawn leftover.
const buildFarmSpotIndexes = (atlas: PetAtlas, pet: Pet, mapId: PetMapId) => {
    const spawns: SpotSpawn[] = []
    const owners: { monster: PetMonster; index: number; spot: number }[] = []
    const indexes: FarmSpotIndexes = new Map()

    for (const monsterIndex of pet.monsters) {
        const monster = atlas.monsters[monsterIndex]

        if (monster.map !== mapId) {
            continue
        }

        indexes.set(monster, [])

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

    for (const group of clusterSpawns(spawns, PET_MAPS[mapId].size)) {
        const counts = new Map<number, number>()

        for (const spawn of group) {
            const spot = owners[spawn.key].spot

            counts.set(spot, (counts.get(spot) ?? 0) + 1)
        }

        let main = -1

        for (const [spot, count] of counts) {
            if (spot >= 0 && (main < 0 || count > (counts.get(main) ?? 0))) {
                main = spot
            }
        }

        for (const spawn of group) {
            const owner = owners[spawn.key]
            const monsterIndexes = indexes.get(owner.monster)

            if (monsterIndexes) {
                monsterIndexes[owner.index] = main
            }
        }
    }

    return indexes
}

// The data never changes while the page is open, so each pet and map is
// grouped once.
const cache = new Map<string, FarmSpotIndexes>()

export const getFarmSpotIndexes = (
    atlas: PetAtlas,
    pet: Pet,
    mapId: PetMapId,
) => {
    const key = `${mapId}:${pet.id}`
    let indexes = cache.get(key)

    if (!indexes) {
        indexes = buildFarmSpotIndexes(atlas, pet, mapId)
        cache.set(key, indexes)
    }

    return indexes
}
