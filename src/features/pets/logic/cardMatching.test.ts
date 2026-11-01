import { describe, expect, it } from "vitest"
import { fillRect, makePixels, type Color } from "@test/pixelFixture"
import {
    buildPetPrint,
    COLLECTION_LAYOUT,
    getPortraitSizes,
    matchCard,
    readLevel,
    sampleCard,
    SHOP_LAYOUT,
    type CardLayout,
} from "./cardMatching"

// Cards are drawn 40 px wide, so one pixel is one sample cell.
const CARD_WIDTH = 40

// A blocky picture that differs per pet but stays the same at any size.
const shadeAt = (seed: number, u: number, v: number) => {
    const blockX = Math.floor(u * 8)
    const blockY = Math.floor(v * 8)
    const noise = Math.sin((blockX + 1) * 12.9 * seed + (blockY + 1) * 78.2)

    return Math.round((noise * 0.5 + 0.5) * 200) + 30
}

const tinted = (shade: number, tint: Color): Color => {
    return [shade * tint[0], shade * tint[1], shade * tint[2]]
}

const makePortrait = (seed: number, size: number, tint: Color) => {
    const portrait = makePixels(size, size)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            fillRect(
                portrait,
                x,
                y,
                1,
                1,
                tinted(shadeAt(seed, x / size, y / size), tint),
            )
        }
    }

    return portrait
}

const makePrint = (
    id: number,
    seed: number,
    layout: CardLayout,
    tint: Color = [1, 1, 1],
) => {
    return buildPetPrint(
        id,
        getPortraitSizes(layout).map((size) => {
            return makePortrait(seed, size, tint)
        }),
        layout,
    )
}

// A card showing the portrait at its layout's first placement.
const drawCard = (
    seed: number,
    layout: CardLayout,
    tint: Color = [1, 1, 1],
) => {
    const height = Math.round(CARD_WIDTH * layout.height)
    const pixels = makePixels(CARD_WIDTH, height, [10, 10, 10])
    const [sizeShare, left, top] = layout.placements[0]
    const size = Math.round(sizeShare * CARD_WIDTH)
    const offsetX = Math.round(left * CARD_WIDTH)
    const offsetY = Math.round(top * CARD_WIDTH)

    for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
            fillRect(
                pixels,
                x + offsetX,
                y + offsetY,
                1,
                1,
                tinted(shadeAt(seed, x / size, y / size), tint),
            )
        }
    }

    return sampleCard(
        pixels,
        { x: 0, y: 0, width: CARD_WIDTH, height: height },
        layout,
    )
}

describe("getPortraitSizes", () => {
    it("gives a size per placement", () => {
        expect(getPortraitSizes(COLLECTION_LAYOUT)).toEqual([51, 60, 64])
        expect(getPortraitSizes(SHOP_LAYOUT)).toEqual([27])
    })
})

describe("buildPetPrint", () => {
    it("keeps points inside the art, one list per placement", () => {
        const print = makePrint(7, 1, COLLECTION_LAYOUT)

        expect(print.id).toBe(7)
        expect(print.placements).toHaveLength(3)

        for (const points of print.placements) {
            for (const point of points) {
                expect(point.x).toBeGreaterThanOrEqual(0)
                expect(point.x).toBeLessThan(CARD_WIDTH)
                expect(point.y).toBeLessThan(
                    Math.round(CARD_WIDTH * COLLECTION_LAYOUT.artBottom),
                )
            }
        }
    })

    it("skips see-through pixels", () => {
        const portrait = makePortrait(1, 27, [1, 1, 1])
        const opaque = buildPetPrint(1, [portrait], SHOP_LAYOUT)

        for (let i = 3; i < portrait.data.length; i += 4) {
            portrait.data[i] = 0
        }

        const clear = buildPetPrint(1, [portrait], SHOP_LAYOUT)

        expect(opaque.placements[0].length).toBeGreaterThan(0)
        expect(clear.placements[0]).toEqual([])
    })
})

describe("matchCard", () => {
    it.each([
        ["collection", COLLECTION_LAYOUT],
        ["shop", SHOP_LAYOUT],
    ] as const)("finds the right pet on a %s card", (_name, layout) => {
        const prints = [1, 2, 3, 4].map((seed) => {
            return makePrint(seed * 10, seed, layout)
        })

        for (const seed of [1, 2, 3, 4]) {
            const [best] = matchCard(drawCard(seed, layout), prints, true)

            expect(best.id).toBe(seed * 10)
            expect(best.score).toBeGreaterThan(0.95)
        }
    })

    it("tries the zoomed placement of a selected card", () => {
        const prints = [1, 2].map((seed) => {
            return makePrint(seed, seed, COLLECTION_LAYOUT)
        })
        const zoomed: CardLayout = {
            ...COLLECTION_LAYOUT,
            placements: [COLLECTION_LAYOUT.placements[1]],
        }
        const [best] = matchCard(drawCard(2, zoomed), prints, true)

        expect(best.id).toBe(2)
    })

    it("tells recolored pets apart by color", () => {
        const red: Color = [1, 0.3, 0.3]
        const blue: Color = [0.3, 0.3, 1]
        const prints = [
            makePrint(1, 5, COLLECTION_LAYOUT, red),
            makePrint(2, 5, COLLECTION_LAYOUT, blue),
        ]

        expect(
            matchCard(drawCard(5, COLLECTION_LAYOUT, blue), prints, true)[0].id,
        ).toBe(2)
        expect(
            matchCard(drawCard(5, COLLECTION_LAYOUT, red), prints, true)[0].id,
        ).toBe(1)
    })

    it("ranks a poor match low", () => {
        const prints = [1, 2].map((seed) => {
            return makePrint(seed, seed, COLLECTION_LAYOUT)
        })
        const [first, second] = matchCard(
            drawCard(1, COLLECTION_LAYOUT),
            prints,
            true,
        )

        expect(first.score).toBeGreaterThan(second.score)
    })

    it("keeps only the closest few candidates", () => {
        const prints = Array.from({ length: 10 }, (_, index) => {
            return makePrint(index + 1, index + 1, COLLECTION_LAYOUT)
        })

        expect(
            matchCard(drawCard(1, COLLECTION_LAYOUT), prints, true),
        ).toHaveLength(6)
    })
})

describe("readLevel", () => {
    const rect = { x: 50, y: 20, width: 100, height: 136 }
    // The badge sits around (53, 147).
    const badge = (draw: (pixels: ReturnType<typeof makePixels>) => void) => {
        const pixels = makePixels(300, 300, [40, 40, 40])

        draw(pixels)

        return readLevel(pixels, rect)
    }

    it("is locked with no badge digit", () => {
        expect(badge(() => {})).toBe(0)
    })

    it("reads a narrow white stroke as Lv1", () => {
        expect(
            badge((pixels) => {
                fillRect(pixels, 52, 141, 3, 13, [255, 255, 255])
            }),
        ).toBe(1)
    })

    it("reads a wide white digit as Lv2", () => {
        expect(
            badge((pixels) => {
                fillRect(pixels, 47, 141, 12, 3, [255, 255, 255])
                fillRect(pixels, 47, 151, 12, 3, [255, 255, 255])
            }),
        ).toBe(2)
    })

    it("reads a cyan digit as Lv3", () => {
        expect(
            badge((pixels) => {
                fillRect(pixels, 48, 141, 10, 13, [60, 220, 230])
            }),
        ).toBe(3)
    })

    it("doesn't count a speck", () => {
        expect(
            badge((pixels) => {
                fillRect(pixels, 53, 147, 1, 1, [255, 255, 255])
            }),
        ).toBe(0)
    })
})
