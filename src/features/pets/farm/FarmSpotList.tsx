import type { FarmSpot } from "@pets/logic/farmSpots"
import { FarmSpotRow } from "./FarmSpotRow"

type FarmSpotListProps = {
    spots: FarmSpot[]
    focusedSpot: string | null
    onSpotFocus: (spot: string | null) => void
    onPetSelect: (petId: number) => void
}

export const FarmSpotList = ({
    spots,
    focusedSpot,
    onSpotFocus,
    onPetSelect,
}: FarmSpotListProps) => {
    return spots.map((spot, index) => (
        <FarmSpotRow
            key={spot.name}
            spot={spot}
            rank={index + 1}
            selected={spot.name === focusedSpot}
            onFocus={onSpotFocus}
            onPetSelect={onPetSelect}
        />
    ))
}
