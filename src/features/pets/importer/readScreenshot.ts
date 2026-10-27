import { CARD_RATIO, detectCards } from "@pets/logic/cardDetection"
import {
    COLLECTION_LAYOUT,
    matchCard,
    readLevel,
    sampleCard,
    type PetPrint,
} from "@pets/logic/cardMatching"
import type { CardReading } from "@pets/logic/screenshotImport"
import { decodeScreenshot, getCanvasContext } from "./decodeScreenshot"

// Review list thumbnails, double their shown size for sharp screens.
const THUMBNAIL_WIDTH = 64

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
        const level = readLevel(pixels, rect)
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
            score: best.score,
            thumbnail: thumbnail.toDataURL("image/webp", 0.8),
        })
    }

    bitmap.close()

    return readings
}
