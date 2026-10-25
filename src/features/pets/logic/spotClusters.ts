// Groups map spawns into spots: tight clusters of pins. A spot may cross area
// outlines; a patch where three areas meet is still one place to farm.
// Used by scripts/buildPetAtlas.ts for every pet together, and by the page
// for one pet's own spawns.
// Spots: spawns closer than size / SPOT_LINK join one spot; a spot wider
// than size / SPOT_WIDTH is split; a spot made of up to SPOT_MAX_BLOBS
// blobs splits into them when they score SPOT_BLOB_SCORE or more; spots
// under SPOT_MIN_SPAWNS fold into a neighbour when it stays narrow enough.
const SPOT_LINK = 136
const SPOT_WIDTH = 20
const SPOT_MAX_BLOBS = 4
const SPOT_BLOB_SCORE = 0.5
const SPOT_MIN_SPAWNS = 10

export type SpotSpawn = { x: number; y: number; area: number; key: number }

const getWidth = (spawns: SpotSpawn[]) => {
    const xs = spawns.map((spawn) => spawn.x)
    const ys = spawns.map((spawn) => spawn.y)

    return Math.max(
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys),
    )
}

export const getCenter = (spawns: SpotSpawn[]) => {
    let x = 0
    let y = 0

    for (const spawn of spawns) {
        x += spawn.x
        y += spawn.y
    }

    return { x: x / spawns.length, y: y / spawns.length }
}

// Spawns within `distance` of each other, chained.
const linkSpawns = (spawns: SpotSpawn[], distance: number) => {
    const parents = spawns.map((_, index) => index)
    const findRoot = (index: number): number => {
        if (parents[index] !== index) {
            parents[index] = findRoot(parents[index])
        }

        return parents[index]
    }
    const cells = new Map<string, number[]>()
    const getCell = (x: number, y: number) => {
        return `${Math.floor(x / distance)},${Math.floor(y / distance)}`
    }

    for (const [index, spawn] of spawns.entries()) {
        const cell = getCell(spawn.x, spawn.y)

        cells.set(cell, [...(cells.get(cell) ?? []), index])
    }

    for (const [index, spawn] of spawns.entries()) {
        for (const dx of [-distance, 0, distance]) {
            for (const dy of [-distance, 0, distance]) {
                for (const other of cells.get(
                    getCell(spawn.x + dx, spawn.y + dy),
                ) ?? []) {
                    const near =
                        Math.hypot(
                            spawn.x - spawns[other].x,
                            spawn.y - spawns[other].y,
                        ) <= distance

                    if (near) {
                        parents[findRoot(index)] = findRoot(other)
                    }
                }
            }
        }
    }

    const groups = new Map<number, SpotSpawn[]>()

    for (const [index, spawn] of spawns.entries()) {
        const root = findRoot(index)

        groups.set(root, [...(groups.get(root) ?? []), spawn])
    }

    return [...groups.values()]
}

// k-means seeded with far-apart spawns, so results never change between runs.
const splitInto = (spawns: SpotSpawn[], count: number) => {
    const seeds = [spawns[0]]

    while (seeds.length < count) {
        let farthest = spawns[0]
        let farthestDistance = -1

        for (const spawn of spawns) {
            const distance = Math.min(
                ...seeds.map((seed) => {
                    return Math.hypot(spawn.x - seed.x, spawn.y - seed.y)
                }),
            )

            if (distance > farthestDistance) {
                farthest = spawn
                farthestDistance = distance
            }
        }

        seeds.push(farthest)
    }

    let centers = seeds.map((seed) => ({ x: seed.x, y: seed.y }))
    let parts: SpotSpawn[][] = []

    for (let round = 0; round < 30; round++) {
        parts = centers.map((): SpotSpawn[] => [])

        for (const spawn of spawns) {
            let closest = 0

            for (const [index, center] of centers.entries()) {
                const distance = Math.hypot(
                    spawn.x - center.x,
                    spawn.y - center.y,
                )
                const best = Math.hypot(
                    spawn.x - centers[closest].x,
                    spawn.y - centers[closest].y,
                )

                if (distance < best) {
                    closest = index
                }
            }

            parts[closest].push(spawn)
        }

        centers = parts.map((part, index) => {
            return part.length > 0 ? getCenter(part) : centers[index]
        })
    }

    return parts.filter((part) => part.length > 0)
}

const splitWide = (spawns: SpotSpawn[], maxWidth: number) => {
    if (getWidth(spawns) <= maxWidth) {
        return [spawns]
    }

    for (let count = 2; ; count++) {
        const parts = splitInto(spawns, count)

        if (parts.every((part) => getWidth(part) <= maxWidth)) {
            return parts
        }
    }
}

// Small spots join the nearest spot while it stays narrow.
const foldSmall = (spots: SpotSpawn[][], maxWidth: number) => {
    const done = new Set<SpotSpawn[]>()

    for (;;) {
        spots.sort((a, b) => a.length - b.length)

        const small = spots.find((spot) => {
            return spot.length < SPOT_MIN_SPAWNS && !done.has(spot)
        })

        if (!small) {
            return spots
        }

        const center = getCenter(small)
        let target: SpotSpawn[] | null = null
        let targetDistance = Infinity

        for (const spot of spots) {
            if (spot === small) {
                continue
            }

            const other = getCenter(spot)
            const distance = Math.hypot(center.x - other.x, center.y - other.y)

            if (
                distance < targetDistance &&
                getWidth([...spot, ...small]) <= maxWidth
            ) {
                target = spot
                targetDistance = distance
            }
        }

        if (!target) {
            done.add(small)
            continue
        }

        target.push(...small)
        spots.splice(spots.indexOf(small), 1)
    }
}

// Silhouette score: how much closer each spawn is to its own part than to
// the nearest other part, averaged. Near 1 for separate blobs, near 0 for
// one even spread that was cut in two.
const getSilhouette = (parts: SpotSpawn[][]) => {
    const getMeanDistance = (spawn: SpotSpawn, part: SpotSpawn[]) => {
        let total = 0

        for (const other of part) {
            total += Math.hypot(spawn.x - other.x, spawn.y - other.y)
        }

        return total / part.length
    }
    let total = 0
    let count = 0

    for (const [index, part] of parts.entries()) {
        for (const spawn of part) {
            // The spawn itself adds 0 to its own part's total.
            const own =
                part.length > 1
                    ? (getMeanDistance(spawn, part) * part.length) /
                      (part.length - 1)
                    : 0
            const nearest = Math.min(
                ...parts
                    .filter((_, other) => other !== index)
                    .map((other) => getMeanDistance(spawn, other)),
            )

            total += (nearest - own) / Math.max(own, nearest, 1)
            count++
        }
    }

    return total / count
}

// Linking chains blobs joined by a thin trail of spawns (a road, a shore)
// into one spot; split it into those blobs when they stand clearly apart.
const splitBlobs = (spawns: SpotSpawn[]): SpotSpawn[][] => {
    let best: SpotSpawn[][] | null = null
    let bestScore = SPOT_BLOB_SCORE

    for (let count = 2; count <= SPOT_MAX_BLOBS; count++) {
        if (spawns.length < count * SPOT_MIN_SPAWNS) {
            break
        }

        const parts = splitInto(spawns, count)

        if (parts.some((part) => part.length < SPOT_MIN_SPAWNS)) {
            continue
        }

        const score = getSilhouette(parts)

        if (score > bestScore) {
            best = parts
            bestScore = score
        }
    }

    return best ? best.flatMap(splitBlobs) : [spawns]
}

export const clusterSpawns = (spawns: SpotSpawn[], size: number) => {
    const maxWidth = size / SPOT_WIDTH

    return foldSmall(
        linkSpawns(spawns, size / SPOT_LINK)
            .flatMap((group) => splitWide(group, maxWidth))
            .flatMap(splitBlobs),
        maxWidth,
    )
}

// The area most of a spot's spawns lie in; -1 when none has one.
export const getMainArea = (spawns: SpotSpawn[]) => {
    const counts = new Map<number, number>()

    for (const spawn of spawns) {
        if (spawn.area >= 0) {
            counts.set(spawn.area, (counts.get(spawn.area) ?? 0) + 1)
        }
    }

    let main = -1

    for (const [area, count] of counts) {
        if (main < 0 || count > (counts.get(main) ?? 0)) {
            main = area
        }
    }

    return main
}
