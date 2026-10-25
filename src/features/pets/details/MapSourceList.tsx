import type { PetMapId } from "@pets/config/petMaps"
import type { PetMapSource } from "@pets/logic/petFinder"
import { MapSourceCard } from "./MapSourceCard"

type MapSourceListProps = {
    sources: PetMapSource[]
    mapId: PetMapId
    focusedSpot: string | null
    onSelect: (mapId: PetMapId) => void
    onSpotSelect: (mapId: PetMapId, spot: string) => void
}

export const MapSourceList = ({
    sources,
    mapId,
    focusedSpot,
    onSelect,
    onSpotSelect,
}: MapSourceListProps) => {
    return sources.map((source, index) => (
        <MapSourceCard
            key={source.mapId}
            source={source}
            best={index === 0 && sources.length > 1}
            selected={source.mapId === mapId}
            focusedSpot={focusedSpot}
            onSelect={onSelect}
            onSpotSelect={onSpotSelect}
        />
    ))
}
