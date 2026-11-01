import { describe, expect, it } from "vitest"
import {
    clusterSpawns,
    getCenter,
    getDistance,
    getMainArea,
    type SpotSpawn,
} from "./spotClusters"

// With this size, spawns link within 60 px and a spot is at most 409 px wide.
const SIZE = 8192

let nextKey = 0

const blob = (x: number, y: number, count: number, area = -1) => {
    const side = Math.ceil(Math.sqrt(count))
    const spawns: SpotSpawn[] = []

    for (let index = 0; index < count; index++) {
        spawns.push({
            x: x + (index % side) * 10,
            y: y + Math.floor(index / side) * 10,
            area: area,
            key: nextKey++,
        })
    }

    return spawns
}

const widthOf = (spawns: SpotSpawn[]) => {
    const xs = spawns.map((spawn) => spawn.x)
    const ys = spawns.map((spawn) => spawn.y)

    return Math.max(
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys),
    )
}

describe("getDistance", () => {
    it("measures straight lines", () => {
        expect(getDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5)
    })
})

describe("getCenter", () => {
    it("averages the points", () => {
        expect(
            getCenter([
                { x: 0, y: 0 },
                { x: 10, y: 20 },
            ]),
        ).toEqual({ x: 5, y: 10 })
    })
})

describe("getMainArea", () => {
    it("takes the area most spawns are in, skipping none", () => {
        expect(
            getMainArea([
                ...blob(0, 0, 3, 7),
                ...blob(0, 0, 1, 2),
                ...blob(0, 0, 9, -1),
            ]),
        ).toBe(7)
    })

    it("is -1 with no areas", () => {
        expect(getMainArea(blob(0, 0, 2))).toBe(-1)
    })
})

describe("clusterSpawns", () => {
    it("joins spawns within the link distance", () => {
        expect(clusterSpawns(blob(0, 0, 16), SIZE)).toHaveLength(1)
    })

    it("keeps big groups far apart separate", () => {
        const spots = clusterSpawns(
            [...blob(0, 0, 16), ...blob(4000, 4000, 16)],
            SIZE,
        )

        expect(spots).toHaveLength(2)
    })

    it("keeps every spawn exactly once", () => {
        const spawns = [
            ...blob(0, 0, 16),
            ...blob(500, 0, 3),
            ...blob(4000, 4000, 25),
        ]
        const keys = clusterSpawns(spawns, SIZE)
            .flat()
            .map((spawn) => spawn.key)

        expect(keys.sort((a, b) => a - b)).toEqual(
            spawns.map((spawn) => spawn.key).sort((a, b) => a - b),
        )
    })

    it("splits a chain wider than a spot may be", () => {
        // A line of spawns 50 px apart links into one long group.
        const line: SpotSpawn[] = []

        for (let index = 0; index < 40; index++) {
            line.push({ x: index * 50, y: 0, area: -1, key: nextKey++ })
        }

        const spots = clusterSpawns(line, SIZE)

        expect(spots.length).toBeGreaterThan(1)

        for (const spot of spots) {
            expect(widthOf(spot)).toBeLessThanOrEqual(SIZE / 20)
        }
    })

    it("folds a small group into a neighbor that stays narrow", () => {
        const spots = clusterSpawns(
            [...blob(0, 0, 16), ...blob(200, 0, 3)],
            SIZE,
        )

        expect(spots).toHaveLength(1)
    })

    it("won't fold when the result would be too wide", () => {
        const spots = clusterSpawns(
            [...blob(0, 0, 16), ...blob(1000, 0, 3)],
            SIZE,
        )

        expect(spots).toHaveLength(2)
    })

    it("with reach, keeps a group of 5+ apart past that distance", () => {
        const spawns = [...blob(0, 0, 16), ...blob(250, 0, 6)]

        expect(clusterSpawns(spawns, SIZE)).toHaveLength(1)
        expect(clusterSpawns(spawns, SIZE, 2)).toHaveLength(2)
    })

    it("with reach, still folds a group under 5", () => {
        const spawns = [...blob(0, 0, 16), ...blob(250, 0, 4)]

        expect(clusterSpawns(spawns, SIZE, 2)).toHaveLength(1)
    })

    it("splits blobs joined by a thin trail", () => {
        const trail: SpotSpawn[] = []

        for (let x = 110; x < 280; x += 50) {
            trail.push({ x: x, y: 20, area: -1, key: nextKey++ })
        }

        const spots = clusterSpawns(
            [...blob(0, 0, 49), ...trail, ...blob(300, 0, 49)],
            SIZE,
        )

        expect(spots).toHaveLength(2)
    })

    it("gives the same result for the same input", () => {
        const spawns = [...blob(0, 0, 30), ...blob(350, 0, 30)]
        const first = clusterSpawns([...spawns], SIZE).map(
            (spot) => spot.length,
        )
        const second = clusterSpawns([...spawns], SIZE).map(
            (spot) => spot.length,
        )

        expect(first).toEqual(second)
    })

    it("handles no spawns", () => {
        expect(clusterSpawns([], SIZE)).toEqual([])
    })
})
