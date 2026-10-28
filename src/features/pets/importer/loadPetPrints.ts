import { getPetIconUrl } from "@assets/pets"
import type { Pet } from "@pets/data/petAtlas"
import {
    buildPetPrint,
    getPortraitSizes,
    type CardLayout,
    type PetPrint,
} from "@pets/logic/cardMatching"

const pending = new Map<CardLayout, Promise<PetPrint[]>>()

// Not Image.decode(): it can wait on the page painting, which stalls in a
// background tab.
const loadImage = async (url: string) => {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`${url}: ${response.status}`)
    }

    return createImageBitmap(await response.blob())
}

const buildPrints = async (pets: Pet[], layout: CardLayout) => {
    const sizes = getPortraitSizes(layout)
    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d", { willReadFrequently: true })
    const prints: PetPrint[] = []

    if (!context) {
        throw new Error("This browser can't read images.")
    }

    canvas.width = Math.max(...sizes)
    canvas.height = canvas.width
    context.imageSmoothingQuality = "high"

    // A pet without a portrait can't be recognized.
    const portraitPets = pets.flatMap((pet) => {
        const url = getPetIconUrl(pet.icon)

        return url ? [{ pet, url }] : []
    })
    // All at once: one by one waits ~200 round trips when the cache is stale.
    const images = await Promise.all(
        portraitPets.map(({ url }) => loadImage(url)),
    )

    for (const [index, { pet }] of portraitPets.entries()) {
        const image = images[index]
        const portraits = sizes.map((size) => {
            context.clearRect(0, 0, canvas.width, canvas.height)
            context.drawImage(image, 0, 0, size, size)

            return context.getImageData(0, 0, size, size)
        })

        image.close()
        prints.push(buildPetPrint(pet.id, portraits, layout))
    }

    return prints
}

// Starts building the prints early (when a dialog opens) so the first
// screenshot doesn't wait on them. A failure is retried by the import.
export const preloadPetPrints = (pets: Pet[], layout: CardLayout) => {
    loadPetPrints(pets, layout).catch(() => undefined)
}

// Every pet's portrait print for one card layout, built once per visit.
export const loadPetPrints = (pets: Pet[], layout: CardLayout) => {
    let prints = pending.get(layout)

    if (!prints) {
        prints = buildPrints(pets, layout).catch((error: unknown) => {
            // Let the next import try again.
            pending.delete(layout)
            throw error
        })
        pending.set(layout, prints)
    }

    return prints
}
