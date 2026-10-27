import { CARD_RATIO, detectCards } from "@pets/logic/cardDetection"
import {
    matchCard,
    readLevel,
    sampleCard,
    type PetPrint,
} from "@pets/logic/cardMatching"
import type { CardReading } from "@pets/logic/screenshotImport"

// Review list thumbnails, double their shown size for sharp screens.
const THUMBNAIL_WIDTH = 64

const getContext = (canvas: HTMLCanvasElement) => {
    const context = canvas.getContext("2d", { willReadFrequently: true })

    if (!context) {
        throw new Error("This browser can't read images.")
    }

    return context
}

// Reads every whole pet card in one screenshot of the game's Pets grid.
export const readScreenshot = async (file: Blob, prints: PetPrint[]) => {
    const bitmap = await createImageBitmap(file)
    const canvas = document.createElement("canvas")
    const thumbnail = document.createElement("canvas")
    const context = getContext(canvas)
    const thumbnailContext = getContext(thumbnail)
    const readings: CardReading[] = []

    canvas.width = bitmap.width
    canvas.height = bitmap.height
    context.drawImage(bitmap, 0, 0)
    thumbnail.width = THUMBNAIL_WIDTH
    thumbnail.height = Math.round(THUMBNAIL_WIDTH * CARD_RATIO)
    thumbnailContext.imageSmoothingQuality = "high"

    const pixels = context.getImageData(0, 0, canvas.width, canvas.height)

    for (const rect of detectCards(pixels)) {
        const level = readLevel(pixels, rect)
        const [best] = matchCard(sampleCard(pixels, rect), prints, level > 0)

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
