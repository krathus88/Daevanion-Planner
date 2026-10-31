import { CARD_RATIO, detectCards } from "@pets/logic/cardDetection"
import {
    COLLECTION_LAYOUT,
    matchCard,
    readLevel,
    sampleCard,
    type PetPrint,
} from "@pets/logic/cardMatching"
import type { CardRect, Pixels } from "@pets/logic/cardDetection"
import {
    readCounterLevel,
    readLockedProgress,
    readProgress,
} from "@pets/logic/cardSouls"
import {
    getLevelNeeded,
    getLevelStart,
    MAX_PET_LEVEL,
    MAX_PET_SOULS,
} from "@pets/logic/petLevels"
import type { CardReading } from "@pets/logic/screenshotImport"
import { decodeScreenshot, getCanvasContext } from "./decodeScreenshot"

// Review list thumbnails, double their shown size for sharp screens.
const THUMBNAIL_WIDTH = 64

const readSouls = (pixels: Pixels, rect: CardRect, level: number) => {
    if (level === MAX_PET_LEVEL) {
        return { souls: MAX_PET_SOULS, unsure: false }
    }

    const needed = getLevelNeeded(level)
    const reading =
        level === 0
            ? readLockedProgress(pixels, rect, needed)
            : readProgress(pixels, rect, needed)

    return {
        souls: getLevelStart(level) + reading.progress,
        unsure: reading.unsure,
    }
}

// The badge tells locked and Lv3 apart; the counter settles Lv1 from Lv2, and
// the two disagreeing is worth a look.
const readCardLevel = (pixels: Pixels, rect: CardRect) => {
    const badgeLevel = readLevel(pixels, rect)

    if (badgeLevel === 0 || badgeLevel === MAX_PET_LEVEL) {
        return { level: badgeLevel, unsure: false }
    }

    const level = readCounterLevel(pixels, rect, badgeLevel)

    return { level: level, unsure: level !== badgeLevel }
}

// Reads every whole pet card in one screenshot of the game's Pets grid.
// prints must be built for COLLECTION_LAYOUT.
export const readScreenshot = async (file: Blob, prints: PetPrint[]) => {
    const { bitmap, pixels } = await decodeScreenshot(file)
    const thumbnail = document.createElement("canvas")
    const thumbnailContext = getCanvasContext(thumbnail)
    const readings: CardReading[] = []

    thumbnail.width = THUMBNAIL_WIDTH
    thumbnail.height = Math.round(THUMBNAIL_WIDTH * CARD_RATIO)
    thumbnailContext.imageSmoothingQuality = "high"

    for (const rect of detectCards(pixels)) {
        const { level, unsure } = readCardLevel(pixels, rect)
        const souls = readSouls(pixels, rect, level)
        const card = sampleCard(pixels, rect, COLLECTION_LAYOUT)
        const [best] = matchCard(card, prints, level > 0)

        thumbnailContext.drawImage(
            bitmap,
            rect.x,
            rect.y,
            rect.width,
            rect.height,
            0,
            0,
            thumbnail.width,
            thumbnail.height,
        )

        readings.push({
            petId: best.id,
            level: level,
            souls: souls.souls,
            soulsUnsure: souls.unsure || unsure,
            score: best.score,
            thumbnail: thumbnail.toDataURL("image/webp", 0.8),
        })
    }

    bitmap.close()

    return readings
}
