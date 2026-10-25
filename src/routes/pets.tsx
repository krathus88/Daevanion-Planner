import { isPetMapId, type PetMapId } from "@pets/config/petMaps"
import { loadPetAtlas } from "@pets/data/petAtlas"
import { PetsPage } from "@pets/PetsPage"
import { createFileRoute } from "@tanstack/react-router"

type PetsSearch = {
    pet?: number
    map?: PetMapId
    // Spot the map is zoomed to; in the URL so it changes with the map.
    spot?: string
}

export const Route = createFileRoute("/pets")({
    validateSearch: (search: Record<string, unknown>): PetsSearch => {
        return {
            pet: Number.isInteger(search.pet) ? Number(search.pet) : undefined,
            map: isPetMapId(search.map) ? search.map : undefined,
            spot:
                typeof search.spot === "string" && search.spot
                    ? search.spot
                    : undefined,
        }
    },
    loader: () => loadPetAtlas(),
    // The data is fixed per deploy; search changes need no reload.
    staleTime: Infinity,
    component: PetsPage,
})
