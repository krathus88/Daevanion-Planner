import type { SpotCount } from "@pets/logic/petFinder"
import type { SpotNeighbors } from "@pets/logic/spotNeighbors"
import { SourceSpotRow } from "./SourceSpotRow"

type SourceSpotListProps = {
    spots: SpotCount[]
    neighbors: SpotNeighbors
    focusedSpot: string | null
    showOthers: boolean
    levels: Record<string, number>
    onSelect: (spot: string, others: boolean) => void
    onPetSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

export const SourceSpotList = ({
    spots,
    neighbors,
    focusedSpot,
    showOthers,
    levels,
    onSelect,
    onPetSelect,
    onLevelChange,
}: SourceSpotListProps) => {
    return spots.map((spot) => (
        <SourceSpotRow
            key={spot.name}
            spot={spot}
            neighbors={neighbors.get(spot) ?? []}
            selected={spot.name === focusedSpot}
            showOthers={showOthers}
            levels={levels}
            onSelect={onSelect}
            onPetSelect={onPetSelect}
            onLevelChange={onLevelChange}
        />
    ))
}
