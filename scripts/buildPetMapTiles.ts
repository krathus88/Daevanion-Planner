// Rebuilds the Pets map's zoomed-out tiles: npm run pets:tiles
// The AION2 Interactive Map only serves full-size tiles (~6 MB per map), so a
// zoomed-out view would download all of them. This saves smaller versions as
// public/pet-maps/<code>/<zoom>/<x>_<y>.webp for zooms below 0.
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import sharp from "sharp"
import {
    getTileUrl,
    OVERVIEW_ZOOMS,
    PET_MAP_IDS,
    PET_MAPS,
    TILE_SIZE,
    type PetMapId,
} from "../src/features/pets/config/petMaps.ts"

const OUT_DIR = join(process.cwd(), "public/pet-maps")

const fetchTile = async (mapId: PetMapId, x: number, y: number) => {
    const url = getTileUrl(mapId, 0, x, y)
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`${url}: ${response.status}`)
    }

    return Buffer.from(await response.arrayBuffer())
}

const buildMap = async (mapId: PetMapId) => {
    const map = PET_MAPS[mapId]
    const originals: { x: number; y: number; data: Buffer }[] = []

    for (let x = 0; x < map.tiles; x++) {
        for (let y = 0; y < map.tiles; y++) {
            originals.push({ x: x, y: y, data: await fetchTile(mapId, x, y) })
        }
    }

    for (const zoom of OVERVIEW_ZOOMS) {
        const scale = 2 ** zoom
        const scaledTile = TILE_SIZE * scale
        // Pad to whole tiles; Leaflet stretches every tile to TILE_SIZE.
        const count = Math.ceil((map.size * scale) / TILE_SIZE)
        const side = count * TILE_SIZE
        const parts = await Promise.all(
            originals.map(async (tile) => {
                return {
                    input: await sharp(tile.data)
                        .resize(scaledTile, scaledTile)
                        .toBuffer(),
                    left: tile.x * scaledTile,
                    top: tile.y * scaledTile,
                }
            }),
        )
        const whole = await sharp({
            create: {
                width: side,
                height: side,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            },
        })
            .composite(parts)
            .png()
            .toBuffer()
        const dir = join(OUT_DIR, map.code, String(zoom))

        mkdirSync(dir, { recursive: true })

        for (let x = 0; x < count; x++) {
            for (let y = 0; y < count; y++) {
                await sharp(whole)
                    .extract({
                        left: x * TILE_SIZE,
                        top: y * TILE_SIZE,
                        width: TILE_SIZE,
                        height: TILE_SIZE,
                    })
                    .webp({ quality: 80 })
                    .toFile(join(dir, `${x}_${y}.webp`))
            }
        }

        console.log(`${map.name} zoom ${zoom}: ${count * count} tiles`)
    }
}

for (const mapId of PET_MAP_IDS) {
    await buildMap(mapId)
}
