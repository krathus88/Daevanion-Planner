import { PET_CATEGORY_IDS } from "@pets/config/petCategories"
import { getTileUrl, TILE_SIZE, type PetMapId } from "@pets/config/petMaps"
import type { PetPin } from "@pets/logic/petFinder"
import { getMapBounds, toLatLng } from "@pets/map/mapCoords"
import { PinLayer, type PinColors } from "@pets/map/PinLayer"
import L from "leaflet"
import { useEffect, useEffectEvent, useState, type RefObject } from "react"

const ATTRIBUTION =
    'Map © NCSOFT via <a href="https://github.com/aion2-interactive-map/aion2-interactive-map" target="_blank" rel="noreferrer">AION2 Interactive Map</a> (CC BY-NC 4.0)'

// Zoom 0 shows map pixels 1:1.
const MIN_ZOOM = -4
const MAX_ZOOM = 1

class PetTileLayer extends L.TileLayer {
    mapId: PetMapId

    constructor(mapId: PetMapId, options: L.TileLayerOptions) {
        super("", options)
        this.mapId = mapId
    }

    getTileUrl(coords: L.Coords) {
        return getTileUrl(this.mapId, coords.z, coords.x, coords.y)
    }
}

// Canvas pins can't read CSS variables, so resolve the theme colors once.
const readColor = (element: HTMLElement, token: string) => {
    return getComputedStyle(element)
        .getPropertyValue(`--chakra-colors-${token}`)
        .trim()
}

const readPinColors = (element: HTMLElement): PinColors => {
    const fill: Record<string, string> = {}

    for (const category of PET_CATEGORY_IDS) {
        fill[category] = readColor(element, `pet-${category}`)
    }

    return { fill: fill, ring: readColor(element, "pet-pin-ring") }
}

export const usePetMap = (
    containerRef: RefObject<HTMLDivElement | null>,
    mapId: PetMapId,
    pins: PetPin[],
    // The view fits these, or the whole map when empty.
    focusPins: PetPin[],
    // Refits the view when it changes: a new map, pet or area.
    focusKey: string,
    // Bigger pins when only one pet shows.
    emphasized: boolean,
    onPinSelect: (petId: number) => void,
) => {
    const [view, setView] = useState<{
        map: L.Map
        pins: PinLayer
        colors: PinColors
    } | null>(null)

    const selectPin = useEffectEvent((petId: number) => {
        onPinSelect(petId)
    })

    const fitView = useEffectEvent((leafletMap: L.Map) => {
        if (focusPins.length > 0) {
            const bounds = L.latLngBounds(
                focusPins.map((pin) => toLatLng(pin.x, pin.y)),
            )

            leafletMap.fitBounds(bounds, { padding: [48, 48], maxZoom: -0.5 })
        } else {
            leafletMap.fitBounds(getMapBounds(mapId))
        }
    })

    useEffect(() => {
        const container = containerRef.current

        if (!container) {
            return
        }

        const leafletMap = L.map(container, {
            crs: L.CRS.Simple,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            zoomSnap: 0.25,
            zoomDelta: 0.5,
            wheelPxPerZoomLevel: 120,
        })
        const pinLayer = new PinLayer((petId) => selectPin(petId))
        const observer = new ResizeObserver(() => {
            leafletMap.invalidateSize()
        })

        pinLayer.addTo(leafletMap)
        observer.observe(container)
        setView({
            map: leafletMap,
            pins: pinLayer,
            colors: readPinColors(container),
        })

        return () => {
            observer.disconnect()
            leafletMap.remove()
            setView(null)
        }
    }, [containerRef])

    useEffect(() => {
        if (!view) {
            return
        }

        const bounds = getMapBounds(mapId)
        const tiles = new PetTileLayer(mapId, {
            tileSize: TILE_SIZE,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM,
            // Below -3 Leaflet shrinks the -3 tiles; above 0 it enlarges 0.
            minNativeZoom: -3,
            maxNativeZoom: 0,
            noWrap: true,
            bounds: bounds,
            attribution: ATTRIBUTION,
        })

        tiles.addTo(view.map)
        view.map.setMaxBounds(bounds.pad(0.25))

        return () => {
            tiles.remove()
        }
    }, [view, mapId])

    useEffect(() => {
        view?.pins.setPins(pins, view.colors, emphasized ? 5 : 4)
    }, [view, pins, emphasized])

    useEffect(() => {
        if (view) {
            fitView(view.map)
        }
    }, [view, focusKey])
}
