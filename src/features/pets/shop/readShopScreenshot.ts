import {
    decodeScreenshot,
    getCanvasContext,
} from "@pets/importer/decodeScreenshot"
import {
    matchCard,
    sampleCard,
    SHOP_LAYOUT,
    type PetPrint,
} from "@pets/logic/cardMatching"
import type { ShopReading } from "@pets/logic/shopCheck"
import { detectShopCards } from "@pets/logic/shopCardDetection"

// Result thumbnails, double their shown size for sharp screens.
const THUMBNAIL_SIZE = 64

// Reads every pet card in one screenshot of the game Shop's Pets tab.
// prints must be built for SHOP_LAYOUT.
export const readShopScreenshot = async (file: Blob, prints: PetPrint[]) => {
    const { bitmap, pixels } = await decodeScreenshot(file)
    const thumbnail = document.createElement("canvas")
    const thumbnailContext = getCanvasContext(thumbnail)
    const [[size, left, top]] = SHOP_LAYOUT.placements
    const readings: ShopReading[] = []

    thumbnail.width = THUMBNAIL_SIZE
    thumbnail.height = THUMBNAIL_SIZE
    thumbnailContext.imageSmoothingQuality = "high"

    for (const rect of detectShopCards(pixels)) {
        const card = sampleCard(pixels, rect, SHOP_LAYOUT)
        // Shop art is always in color.
        const [best] = matchCard(card, prints, true)

        // Just the art: the card's name is too small to read here.
        thumbnailContext.drawImage(
            bitmap,
            rect.x + rect.width * left,
            rect.y + rect.width * top,
            rect.width * size,
            rect.width * size,
            0,
            0,
            THUMBNAIL_SIZE,
            THUMBNAIL_SIZE,
        )

        readings.push({
            petId: best.id,
            score: best.score,
            thumbnail: thumbnail.toDataURL("image/webp", 0.8),
        })
    }

    bitmap.close()

    return readings
}
