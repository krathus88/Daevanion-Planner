import { PET_MAPS, type PetMapId } from "@pets/config/petMaps"
import L from "leaflet"

// Map pixels (y down) to Leaflet's simple CRS (lat grows up).
export const toLatLng = (x: number, y: number) => {
    return L.latLng(-y, x)
}

export const getMapBounds = (mapId: PetMapId) => {
    const size = PET_MAPS[mapId].size

    return L.latLngBounds(toLatLng(0, size), toLatLng(size, 0))
}
