import { getPetIconUrl } from "@assets/pets"
import type { Pet } from "@pets/data/petAtlas"
import {
    buildPetPrint,
    getPortraitSizes,
    type PetPrint,
} from "@pets/logic/cardMatching"

let pending: Promise<PetPrint[]> | null = null

// Not Image.decode(): it can wait on the page painting, which stalls in a
// background tab.
const loadImage = async (url: string) => {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`${url}: ${response.status}`)
    }

    return createImageBitmap(await response.blob())
}

const buildPrints = async (pets: Pet[]) => {
    const sizes = getPortraitSizes()
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d", { willReadFrequently: true })
    const prints: PetPrint[] = []

    if (!context) {
        throw new Error("This browser can't read images.")
    }

    canvas.width = Math.max(...sizes)
    canvas.height = canvas.width
    context.imageSmoothingQuality = "high"

    for (const pet of pets) {
        const url = getPetIconUrl(pet.icon)

        // A pet without a portrait can't be recognized.
        if (!url) continue

        const image = await loadImage(url)
        const portraits = sizes.map((size) => {
            context.clearRect(0, 0, canvas.width, canvas.height)
            context.drawImage(image, 0, 0, size, size)

            return context.getImageData(0, 0, size, size)
        })

        image.close()
        prints.push(buildPetPrint(pet.id, portraits))
    }

    return prints
}

// Every pet's portrait print, built once per visit.
export const loadPetPrints = (pets: Pet[]) => {
    if (!pending) {
        pending = buildPrints(pets).catch((error: unknown) => {
            // Let the next import try again.
            pending = null
            throw error
        })
    }

    return pending
}
