import type { SpotCount } from "@pets/logic/petFinder"
import { SourceSpotButton } from "./SourceSpotButton"

type SourceSpotListProps = {
    spots: SpotCount[]
    focusedSpot: string | null
    onSelect: (spot: string) => void
}

export const SourceSpotList = ({
    spots,
    focusedSpot,
    onSelect,
}: SourceSpotListProps) => {
    return spots.map((spot) => (
        <SourceSpotButton
            key={spot.name}
            spot={spot}
            selected={spot.name === focusedSpot}
            onSelect={onSelect}
        />
    ))
}
