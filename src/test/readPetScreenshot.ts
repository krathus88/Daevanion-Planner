import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"
import sharp, { type Sharp } from "sharp"
import type { PetAtlas } from "@pets/data/petAtlas"
import { detectCards } from "@pets/logic/cardDetection"
import {
    buildPetPrint,
    COLLECTION_LAYOUT,
    getPortraitSizes,
    matchCard,
    readLevel,
    sampleCard,
    type CardLayout,
    type PetPrint,
} from "@pets/logic/cardMatching"
import {
    readCounterLevel,
    readLockedProgress,
    readProgress,
} from "@pets/logic/cardSouls"
import { getLevelNeeded } from "@pets/logic/petLevels"
import { detectShopCards } from "@pets/logic/shopCardDetection"
import { readShopCard } from "@pets/logic/shopCardReading"

const toPixels = async (image: Sharp) => {
    const { data, info } = await image
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true })

    return { data: data, width: info.width, height: info.height, channels: 4 }
}

const assetUrl = (path: string) => {
    return new URL(`../${path}`, import.meta.url)
}

export const readAtlas = (): PetAtlas => {
    return JSON.parse(
        readFileSync(assetUrl("features/pets/data/petAtlas.json"), "utf-8"),
    )
}

// What importer/loadPetPrints builds with a canvas, from the same portraits.
export const buildPrints = async (
    atlas: PetAtlas,
    layout: CardLayout = COLLECTION_LAYOUT,
) => {
    const prints: PetPrint[] = []

    for (const pet of atlas.pets) {
        if (!pet.icon) {
            continue
        }

        const file = fileURLToPath(assetUrl(`assets/pets/${pet.icon}.webp`))
        const portraits = []

        for (const size of getPortraitSizes(layout)) {
            portraits.push(
                await toPixels(sharp(file).resize(size, size, { fit: "fill" })),
            )
        }

        prints.push(buildPetPrint(pet.id, portraits, layout))
    }

    return prints
}

const screenshotPath = (name: string) => {
    return fileURLToPath(assetUrl(`test/screenshots/${name}`))
}

export const loadScreenshot = (name: string) => {
    return toPixels(sharp(screenshotPath(name)))
}

// The steps of shop/readShopScreenshot, which needs a canvas. Keep them in step.
export const readShopScreenshot = async (name: string, prints: PetPrint[]) => {
    const pixels = await loadScreenshot(name)

    return detectShopCards(pixels).map((rect) => {
        return { ...readShopCard(pixels, rect, prints), thumbnail: "" }
    })
}

// The steps of importer/readScreenshot, which needs a canvas. Keep them in
// step. A card reads as "MAX", or as what its counter shows, like "56/75".
export const readPetScreenshot = async (
    name: string,
    atlas: PetAtlas,
    prints: PetPrint[],
) => {
    const pixels = await toPixels(sharp(screenshotPath(name)))
    const names = new Map(atlas.pets.map((pet) => [pet.id, pet.name]))

    return detectCards(pixels).map((rect) => {
        const badge = readLevel(pixels, rect)
        const level =
            badge === 0 || badge === 3
                ? badge
                : readCounterLevel(pixels, rect, badge)
        const [best] = matchCard(
            sampleCard(pixels, rect, COLLECTION_LAYOUT),
            prints,
            level > 0,
        )
        let counter = "MAX"
        let unsure = false

        if (level < 3) {
            const needed = getLevelNeeded(level)
            const reading =
                level === 0
                    ? readLockedProgress(pixels, rect, needed)
                    : readProgress(pixels, rect, needed)

            counter = `${reading.progress}/${needed}`
            unsure = reading.unsure
        }

        return { counter: counter, pet: names.get(best.id), unsure: unsure }
    })
}
