import type { PetCategoryId } from "@pets/config/petCategories"
import type { FarmSpot } from "@pets/logic/farmSpots"
import { FarmSpotRow } from "./FarmSpotRow"

type FarmSpotListProps = {
    spots: FarmSpot[]
    focusedSpot: string | null
    requiredCategories: PetCategoryId[]
    onSpotFocus: (spot: string | null) => void
    onPetSelect: (petId: number) => void
}

export const FarmSpotList = ({
    spots,
    focusedSpot,
    requiredCategories,
    onSpotFocus,
    onPetSelect,
}: FarmSpotListProps) => {
    return spots.map((spot, index) => (
        <FarmSpotRow
            key={spot.name}
            spot={spot}
            rank={index + 1}
            selected={spot.name === focusedSpot}
            requiredCategories={requiredCategories}
            onFocus={onSpotFocus}
            onPetSelect={onPetSelect}
        />
    ))
}
