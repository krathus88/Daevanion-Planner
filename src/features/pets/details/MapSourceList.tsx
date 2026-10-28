import type { PetMapId } from "@pets/config/petMaps"
import { getMostSpawnsMap, type PetMapSource } from "@pets/logic/petFinder"
import type { SpotNeighbors } from "@pets/logic/spotNeighbors"
import { MapSourceCard } from "./MapSourceCard"

type MapSourceListProps = {
    sources: PetMapSource[]
    neighbors: SpotNeighbors
    mapId: PetMapId
    focusedSpot: string | null
    showOthers: boolean
    levels: Record<string, number>
    onSelect: (mapId: PetMapId) => void
    onSpotSelect: (mapId: PetMapId, spot: string, others: boolean) => void
    onPetSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

export const MapSourceList = ({
    sources,
    neighbors,
    mapId,
    focusedSpot,
    showOthers,
    levels,
    onSelect,
    onSpotSelect,
    onPetSelect,
    onLevelChange,
}: MapSourceListProps) => {
    // Cards keep the map order; the badge marks the one with most spawns.
    const mostSpawnsMap = sources.length > 1 ? getMostSpawnsMap(sources) : null

    return sources.map((source) => (
        <MapSourceCard
            key={source.mapId}
            source={source}
            neighbors={neighbors}
            best={source.mapId === mostSpawnsMap}
            selected={source.mapId === mapId}
            focusedSpot={focusedSpot}
            showOthers={showOthers}
            levels={levels}
            onSelect={onSelect}
            onSpotSelect={onSpotSelect}
            onPetSelect={onPetSelect}
            onLevelChange={onLevelChange}
        />
    ))
}
