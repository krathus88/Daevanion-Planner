import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import type { Pet, PetAtlas, PetMonster } from "@pets/data/petAtlas"
import { clusterSpawns, getDistance, type SpotSpawn } from "./spotClusters"

// One spawn of a pet: where it is, its monster, its index in the monster's
// spawns, and the map spot it lies in.
type PatchSpawn = {
    x: number
    y: number
    monster: PetMonster
    index: number
    spot: number
}

type Point = { x: number; y: number }

type Box = { left: number; top: number; right: number; bottom: number }

// One pet's own cluster of pins and the box around them.
export type PetPatch = Box & {
    pet: Pet
    spawns: PatchSpawn[]
}

const SPAWN_STRIDE = 3

// Pins within size / PATCH_GAP of each other count as the same ground: the
// distance spots link pins at.
const PATCH_GAP = 136
// A Best spot stays as narrow as a map spot.
const PATCH_WIDTH = 20
// Two spots merge when this share of the smaller one's pins lies on the
// other's ground. Patch pairs below PATCH_PAIR_SHARE are never tried.
const PATCH_SHARE = 0.5
const PATCH_PAIR_SHARE = 0.2
// A few pins of a pet off on their own (over twice the link distance away)
// stay their own patch, so the spot they lie in lists the pet too.
const PATCH_FOLD_REACH = 2

const buildPetPatches = (atlas: PetAtlas, pet: Pet, mapId: PetMapId) => {
    const spawns: SpotSpawn[] = []
    const owners: PatchSpawn[] = []

    for (const monsterIndex of pet.monsters) {
        const monster = atlas.monsters[monsterIndex]

        if (monster.map !== mapId) {
            continue
        }

        for (let i = 0; i < monster.spawns.length; i += SPAWN_STRIDE) {
            const spot = monster.spawns[i + 2]

            spawns.push({
                x: monster.spawns[i],
                y: monster.spawns[i + 1],
                area: atlas.spots[mapId][spot]?.area ?? -1,
                key: owners.length,
            })
            owners.push({
                x: monster.spawns[i],
                y: monster.spawns[i + 1],
                monster: monster,
                index: i / SPAWN_STRIDE,
                spot: spot,
            })
        }
    }

    return clusterSpawns(spawns, PET_MAPS[mapId].size, PATCH_FOLD_REACH).map(
        (group): PetPatch => {
            return {
                ...getBox(group),
                pet: pet,
                spawns: group.map((spawn) => owners[spawn.key]),
            }
        },
    )
}

export const getBox = (points: Point[]): Box => {
    const xs = points.map((point) => point.x)
    const ys = points.map((point) => point.y)

    return {
        left: Math.min(...xs),
        top: Math.min(...ys),
        right: Math.max(...xs),
        bottom: Math.max(...ys),
    }
}

// The data never changes while the page is open, so each pet and map is
// grouped once.
const cache = new Map<string, PetPatch[]>()

export const getPetPatches = (atlas: PetAtlas, pet: Pet, mapId: PetMapId) => {
    const key = `${mapId}:${pet.id}`
    let patches = cache.get(key)

    if (!patches) {
        patches = buildPetPatches(atlas, pet, mapId)
        cache.set(key, patches)
    }

    return patches
}

// The distance pins count as the same ground at.
export const getPatchGap = (mapId: PetMapId) => {
    return PET_MAPS[mapId].size / PATCH_GAP
}

// The points that have one of `others` within `gap`.
export const getNearPoints = <T extends Point>(
    points: T[],
    others: Point[],
    gap: number,
) => {
    const cells = new Map<string, Point[]>()
    const getCell = (x: number, y: number) => {
        return `${Math.floor(x / gap)},${Math.floor(y / gap)}`
    }

    for (const other of others) {
        const cell = getCell(other.x, other.y)
        const members = cells.get(cell)

        if (members) {
            members.push(other)
        } else {
            cells.set(cell, [other])
        }
    }

    const hasNear = (point: Point) => {
        for (const dx of [-gap, 0, gap]) {
            for (const dy of [-gap, 0, gap]) {
                for (const other of cells.get(
                    getCell(point.x + dx, point.y + dy),
                ) ?? []) {
                    if (getDistance(point, other) <= gap) {
                        return true
                    }
                }
            }
        }

        return false
    }

    return points.filter(hasNear)
}

// Share of the smaller list's pins that have a pin of the other within
// `gap`: near 1 when two pets spawn on the same ground, near 0 when they
// only touch at an edge.
const getNearShare = (a: Point[], b: Point[], gap: number) => {
    const [small, large] = a.length <= b.length ? [a, b] : [b, a]

    return getNearPoints(small, large, gap).length / small.length
}

const pairShares = new WeakMap<PetPatch, Map<PetPatch, number>>()

// Patches never change, so a pair's share is worked out once; filtering the
// list only changes which pairs are asked for.
const getPairShare = (a: PetPatch, b: PetPatch, gap: number) => {
    let shares = pairShares.get(a)

    if (!shares) {
        shares = new Map()
        pairShares.set(a, shares)
    }

    let share = shares.get(b)

    if (share === undefined) {
        share = getNearShare(a.spawns, b.spawns, gap)
        shares.set(b, share)
    }

    return share
}

// Whether two lists of pins spawn on the same ground, the way Best spots
// merge.
export const sharesGround = (a: Point[], b: Point[], gap: number) => {
    return getNearShare(a, b, gap) >= PATCH_SHARE
}

// Whether two boxes, grown by `gap`, touch.
export const isTouching = (a: Box, b: Box, gap: number) => {
    return (
        a.left - gap <= b.right + gap &&
        b.left - gap <= a.right + gap &&
        a.top - gap <= b.bottom + gap &&
        b.top - gap <= a.bottom + gap
    )
}

const getWidth = (spawns: PatchSpawn[]) => {
    const xs = spawns.map((spawn) => spawn.x)
    const ys = spawns.map((spawn) => spawn.y)

    return Math.max(
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys),
    )
}

// Groups patches of different pets that spawn on the same ground into one
// Best spot, the pairs sharing the most first. A merge needs the two whole
// spots to share ground, not just one pair, so a pet that spreads between
// two places doesn't chain them together; spots also stay narrow. Each pet's
// patch stays whole, so a pet never shows up split over two spots next to
// each other.
export const mergePatches = (patches: PetPatch[], mapId: PetMapId) => {
    const size = PET_MAPS[mapId].size
    const gap = getPatchGap(mapId)
    const pairs: { a: number; b: number; share: number }[] = []

    for (let a = 0; a < patches.length; a++) {
        for (let b = a + 1; b < patches.length; b++) {
            if (!isTouching(patches[a], patches[b], gap)) {
                continue
            }

            const share = getPairShare(patches[a], patches[b], gap)

            if (share >= PATCH_PAIR_SHARE) {
                pairs.push({ a: a, b: b, share: share })
            }
        }
    }

    pairs.sort((first, second) => second.share - first.share)

    const groups = patches.map((patch) => [patch])
    const groupOf = patches.map((_, index) => index)

    for (const pair of pairs) {
        const first = groupOf[pair.a]
        const second = groupOf[pair.b]

        if (first === second) {
            continue
        }

        const firstSpawns = groups[first].flatMap((patch) => patch.spawns)
        const secondSpawns = groups[second].flatMap((patch) => patch.spawns)
        const fits =
            getWidth([...firstSpawns, ...secondSpawns]) <= size / PATCH_WIDTH &&
            sharesGround(firstSpawns, secondSpawns, gap)

        if (!fits) {
            continue
        }

        groups[first] = [...groups[first], ...groups[second]]
        groups[second] = []

        for (const [index, group] of groupOf.entries()) {
            if (group === second) {
                groupOf[index] = first
            }
        }
    }

    return groups.filter((group) => group.length > 0)
}
