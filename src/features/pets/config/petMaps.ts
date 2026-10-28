// Maps with tracked pet spawns. Coordinates are map pixels at full size,
// matching the AION2 Interactive Map's tiles (`code` is its map name).
// Maps always show in this order.
export const PET_MAP_IDS = ["verteron", "reshanta", "altgard"] as const

export type PetMapId = (typeof PET_MAP_IDS)[number]

type PetMapInfo = {
    name: string
    short: string
    code: string
    size: number
    tiles: number
}

export const PET_MAPS: Record<PetMapId, PetMapInfo> = {
    verteron: {
        name: "Verteron",
        short: "V",
        code: "World_L_A",
        size: 8192,
        tiles: 8,
    },
    altgard: {
        name: "Altgard",
        short: "A",
        code: "World_D_A",
        size: 8192,
        tiles: 8,
    },
    reshanta: {
        name: "Lower Reshanta",
        short: "R",
        code: "Abyss_Reshanta_A",
        size: 4096,
        tiles: 4,
    },
}

export const TILE_SIZE = 1024

const TILE_ROOT =
    "https://aion2-interactive-map.github.io/aion2-interactive-map/UI/Map/WorldMap"

// Zooms below 0 use our own smaller tiles (scripts/buildPetMapTiles.ts) so a
// zoomed-out map doesn't download every full-size tile.
export const OVERVIEW_ZOOMS = [-3, -2, -1]

const pad = (value: number) => {
    return String(value).padStart(2, "0")
}

export const getTileUrl = (
    mapId: PetMapId,
    zoom: number,
    x: number,
    y: number,
) => {
    const code = PET_MAPS[mapId].code

    if (zoom < 0) {
        return `${import.meta.env.BASE_URL}pet-maps/${code}/${zoom}/${x}_${y}.webp`
    }

    return `${TILE_ROOT}/${code}/Res/${code}_${pad(x)}_${pad(y)}.webp`
}

export const isPetMapId = (value: unknown): value is PetMapId => {
    return PET_MAP_IDS.some((id) => id === value)
}
