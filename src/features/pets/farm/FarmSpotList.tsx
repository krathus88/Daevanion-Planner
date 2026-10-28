import type { PetCategoryId } from "@pets/config/petCategories"
import type { FarmSpot } from "@pets/logic/farmSpots"
import { FarmSpotRow } from "./FarmSpotRow"

type FarmSpotListProps = {
    spots: FarmSpot[]
    focusedSpot: string | null
    levels: Record<string, number>
    requiredCategories: PetCategoryId[]
    onSpotFocus: (spot: string | null) => void
    onPetSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

export const FarmSpotList = ({
    spots,
    focusedSpot,
    levels,
    requiredCategories,
    onSpotFocus,
    onPetSelect,
    onLevelChange,
}: FarmSpotListProps) => {
    return spots.map((spot, index) => (
        <FarmSpotRow
            key={spot.name}
            spot={spot}
            rank={index + 1}
            selected={spot.name === focusedSpot}
            levels={levels}
            requiredCategories={requiredCategories}
            onFocus={onSpotFocus}
            onPetSelect={onPetSelect}
            onLevelChange={onLevelChange}
        />
    ))
}
