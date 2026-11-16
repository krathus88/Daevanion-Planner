// Maps with tracked pet spawns. Coordinates are map pixels at full size,
// matching the AION2 Interactive Map's tiles (`code` is its map name).
// Maps always show in this order.
export const PET_MAP_IDS = [
    "verteron",
    "reshanta",
    "outerReshanta",
    "altgard",
] as const

export type PetMapId = (typeof PET_MAP_IDS)[number]

// Another site's art for a map the AION2 Interactive Map doesn't have. We
// serve our own copies (scripts/buildPetMapTiles.ts).
type PetMapArt = {
    // The site, for the credit, and its page of the map.
    site: string
    url: string
    // Its tiles at `zoom`, the sharpest it has: <tiles>/<x>/<y>.webp.
    tiles: string
    zoom: number
}

type PetMapInfo = {
    name: string
    short: string
    code: string
    size: number
    // Full-size tiles per side.
    tiles: number
    art?: PetMapArt
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
    // The game's Chaotic Outer Reshanta. No pet spawns are known there yet,
    // and the Interactive Map doesn't have it: `code` is our own name for it,
    // and the size is Wikily's (its art is half that at best).
    outerReshanta: {
        name: "Outer Reshanta",
        short: "O",
        code: "Abyss_Reshanta_Outer",
        size: 4096,
        tiles: 4,
        art: {
            site: "Wikily",
            url: "https://wikily.gg/aion-2/interactive-map/chaotic-outer-reshanta",
            tiles: "https://media.wikily.gg/d9ef9e2b-cdbf-43cb-a423-2947e69d538d/map-tiles/0647a42b-3524-4cad-af7f-5ad8937fb7c1/-1",
            zoom: -1,
        },
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

// The sharpest zoom a map has tiles for: 0 is full size.
export const getSharpestZoom = (mapId: PetMapId) => {
    return PET_MAPS[mapId].art?.zoom ?? 0
}

export const isPetMapId = (value: unknown): value is PetMapId => {
    return PET_MAP_IDS.some((id) => id === value)
}
