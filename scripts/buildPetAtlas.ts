// Rebuilds src/features/pets/data/petAtlas.json: npm run pets:data
// Pets, their soul monsters and spawn pins come from the AION 2 Pet Atlas
// (which joins Global client exports with the AION2 Interactive Map). Area
// names come from the Interactive Map's region outlines (CC BY-NC 4.0).
// Pet portraits (© NCSOFT) come from gegebase, which names each by pet id;
// missing ones are saved as src/assets/pets/<portrait>.webp.
import { existsSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import sharp from "sharp"
import {
    PET_MAP_IDS,
    PET_MAPS,
    type PetMapId,
} from "../src/features/pets/config/petMaps.ts"
import {
    clusterSpawns,
    getCenter,
    getMainArea,
    type SpotSpawn,
} from "../src/features/pets/logic/spotClusters.ts"

const ATLAS_URL = "https://pristine-zone-6q93xmk.shipstatic.com/"
const MAP_DATA_URL =
    "https://raw.githubusercontent.com/aion2-interactive-map/aion2-interactive-map/master/public"
const OUT_PATH = join(process.cwd(), "src/features/pets/data/petAtlas.json")
const ICON_SITE = "https://gegebase.com"
const ICON_DIR = join(process.cwd(), "src/assets/pets")
// Shown at up to 48px; double that for sharp high-DPI screens.
const ICON_SIZE = 96
// Spawns just outside every outline still take the closest area.
const MAX_AREA_DISTANCE = 300
// Named map markers used as spot names; battlefields repeat area names.
const LANDMARK_SUBTYPES = new Set(["seal", "occupation", "village"])
const COMPASS = [
    "east",
    "southeast",
    "south",
    "southwest",
    "west",
    "northwest",
    "north",
    "northeast",
]

type AtlasPet = {
    id: number
    name: string
    category: string
    sourceKind: "field" | "nonfield" | "special"
    sources: number[][]
}

type AtlasMonster = {
    zone: number
    name: string
    level: number
    rank: string
}

type Atlas = {
    meta: {
        client: { patch: number; label: string }
        zones: { mapCode: string }[]
    }
    pets: AtlasPet[]
    monsters: AtlasMonster[]
    // [zone, pet, x, y, monster]
    spawns: [number, number, number, number, number][]
}

type Point = [number, number]

type Region = { name: string; polygons: Point[][] }

const fetchText = async (url: string) => {
    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`${url}: ${response.status}`)
    }

    return response.text()
}

// The page holds the data as `const DATA={...}` in an inline script.
const readAtlas = (html: string): Atlas => {
    const start = html.indexOf("{", html.indexOf("const DATA="))
    let depth = 0
    let inString = false
    let escaped = false

    for (let index = start; index < html.length; index++) {
        const char = html[index]

        if (inString) {
            if (escaped) {
                escaped = false
            } else if (char === "\\") {
                escaped = true
            } else if (char === '"') {
                inString = false
            }

            continue
        }

        if (char === '"') {
            inString = true
        } else if (char === "{") {
            depth++
        } else if (char === "}") {
            depth--

            if (depth === 0) {
                return JSON.parse(html.slice(start, index + 1))
            }
        }
    }

    throw new Error("Could not find the Pet Atlas data.")
}

// regions/<map>.yaml: "- borders:" then polygons as "- - - x" (new polygon),
// "- - x" (new point) and "- y" lines, then the region's name.
const parseRegions = (yaml: string) => {
    const regions: Region[] = []
    let polygon: Point[] = []
    let point: number[] = []

    for (const line of yaml.split(/\r?\n/)) {
        const region = regions[regions.length - 1]

        if (line.startsWith("- borders:")) {
            regions.push({ name: "", polygons: [] })
            continue
        }

        const name = /^ {2}name: (\S+)$/.exec(line)

        if (name && region) {
            region.name = name[1]
            continue
        }

        const number = /^\s*((?:- )+)(-?[\d.]+)$/.exec(line)

        if (!number || !region) {
            continue
        }

        const dashes = number[1].length / 2

        if (dashes === 3) {
            polygon = []
            region.polygons.push(polygon)
        }

        if (dashes >= 2) {
            point = []
            polygon.push(point as Point)
        }

        point.push(Number(number[2]))
    }

    return regions
}

// locales/en/regions/<map>.yaml: "Key:" then "  name: Display Name"
// (markers use the same layout, keyed by marker id).
const parseRegionNames = (yaml: string) => {
    const names = new Map<string, string>()
    let key = ""

    for (const line of yaml.split(/\r?\n/)) {
        const keyLine = /^([\w-]+):$/.exec(line)
        const nameLine = /^ {2}name: (.+)$/.exec(line)

        if (keyLine) {
            key = keyLine[1]
        } else if (nameLine && key) {
            names.set(key, nameLine[1].replace(/^'|'$/g, ""))
        }
    }

    return names
}

const isInside = (x: number, y: number, polygon: Point[]) => {
    let inside = false

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [xi, yi] = polygon[i]
        const [xj, yj] = polygon[j]

        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
            inside = !inside
        }
    }

    return inside
}

const distanceToPolygon = (x: number, y: number, polygon: Point[]) => {
    let best = Infinity

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const [ax, ay] = polygon[j]
        const [bx, by] = polygon[i]
        const lengthSquared = (bx - ax) ** 2 + (by - ay) ** 2
        const t =
            lengthSquared === 0
                ? 0
                : Math.max(
                      0,
                      Math.min(
                          1,
                          ((x - ax) * (bx - ax) + (y - ay) * (by - ay)) /
                              lengthSquared,
                      ),
                  )

        best = Math.min(
            best,
            Math.hypot(x - (ax + t * (bx - ax)), y - (ay + t * (by - ay))),
        )
    }

    return best
}

const findArea = (x: number, y: number, regions: Region[]) => {
    let closest = -1
    let closestDistance = MAX_AREA_DISTANCE

    for (const [index, region] of regions.entries()) {
        for (const polygon of region.polygons) {
            if (isInside(x, y, polygon)) {
                return index
            }

            const distance = distanceToPolygon(x, y, polygon)

            if (distance < closestDistance) {
                closest = index
                closestDistance = distance
            }
        }
    }

    return closest
}

const readRegions = async (code: string) => {
    const [outlines, locale] = await Promise.all([
        fetchText(`${MAP_DATA_URL}/data/regions/${code}.yaml`),
        fetchText(`${MAP_DATA_URL}/locales/en/regions/${code}.yaml`).catch(
            () => "",
        ),
    ])
    const names = parseRegionNames(locale)
    const regions = parseRegions(outlines)

    return {
        regions: regions,
        names: regions.map((region) => names.get(region.name) ?? region.name),
    }
}

type Landmark = { name: string; x: number; y: number }

// markers/<map>.yaml: "- category: ..." starts a marker, then "  key: value";
// locales/en/markers/<map>.yaml: "<marker id>:" then "  name: Display Name".
const readLandmarks = async (code: string, size: number) => {
    const [markers, locale] = await Promise.all([
        fetchText(`${MAP_DATA_URL}/data/markers/${code}.yaml`),
        fetchText(`${MAP_DATA_URL}/locales/en/markers/${code}.yaml`).catch(
            () => "",
        ),
    ])
    const names = parseRegionNames(locale)
    const entries: Record<string, string>[] = []

    for (const line of markers.split(/\r?\n/)) {
        if (line.startsWith("- ")) {
            entries.push({})
        }

        const field = /^[- ] (\w+): (.+)$/.exec(line)

        if (field && entries.length > 0) {
            entries[entries.length - 1][field[1]] = field[2]
        }
    }

    const landmarks: Landmark[] = []

    for (const entry of entries) {
        const name = names.get(entry.id)

        if (name && LANDMARK_SUBTYPES.has(entry.subtype)) {
            landmarks.push({
                name: name.replaceAll("''", "'"),
                x: Number(entry.x),
                // Markers count y up from the bottom, like region outlines.
                y: size - Number(entry.y),
            })
        }
    }

    return landmarks
}

type Spot = { name: string; area: number; spawns: SpotSpawn[] }

// Named after the closest landmark; when several spots share one, the
// closest keeps the plain name and the others say which side they are on.
const nameSpots = (groups: SpotSpawn[][], landmarks: Landmark[]) => {
    const placed = groups.map((spawns) => {
        const center = getCenter(spawns)
        let landmark = landmarks[0]

        for (const candidate of landmarks) {
            if (
                Math.hypot(candidate.x - center.x, candidate.y - center.y) <
                Math.hypot(landmark.x - center.x, landmark.y - center.y)
            ) {
                landmark = candidate
            }
        }

        return {
            spawns: spawns,
            landmark: landmark,
            distance: Math.hypot(landmark.x - center.x, landmark.y - center.y),
            angle: Math.atan2(center.y - landmark.y, center.x - landmark.x),
        }
    })
    const used = new Set<string>()
    const spots: Spot[] = []

    placed.sort((a, b) => a.distance - b.distance)

    for (const entry of placed) {
        const plain = entry.landmark.name
        const side =
            COMPASS[Math.round((entry.angle / (Math.PI / 4) + 8) % 8) % 8]
        let name = used.has(plain) ? `${plain} (${side})` : plain

        for (let number = 2; used.has(name); number++) {
            name = `${plain} (${side} ${number})`
        }

        used.add(name)
        spots.push({
            name: name,
            area: getMainArea(entry.spawns),
            spawns: entry.spawns,
        })
    }

    return spots
}

const buildSpots = (
    spawns: SpotSpawn[],
    landmarks: Landmark[],
    size: number,
) => {
    return nameSpots(clusterSpawns(spawns, size), landmarks).sort((a, b) => {
        return a.name.localeCompare(b.name)
    })
}

type PetIcon = { icon: string; url: string }

// The pet list links each portrait as /icons/aion2/pets/<id>_<Portrait>.png.
// The Atlas gives pets without a client id a negative id, so match by name too.
const readPetIcons = async () => {
    const html = await fetchText(`${ICON_SITE}/games/aion2/pets`)
    const byId = new Map<number, PetIcon>()
    const byName = new Map<string, PetIcon>()
    const pattern =
        /<img alt="([^"]+)"[^>]*src="(\/icons\/aion2\/pets\/(-?\d+)_(\w+)\.png)"/g

    for (const [, name, path, id, portrait] of html.matchAll(pattern)) {
        const entry = {
            icon: portrait.toLowerCase().replaceAll("_", "-"),
            url: `${ICON_SITE}${path}`,
        }

        byId.set(Number(id), entry)
        byName.set(
            name.replaceAll("&#x27;", "'").replaceAll("&amp;", "&"),
            entry,
        )
    }

    return { byId: byId, byName: byName }
}

const saveIcon = async ({ icon, url }: PetIcon) => {
    const path = join(ICON_DIR, `${icon}.webp`)

    if (existsSync(path)) {
        return
    }

    const response = await fetch(url)

    if (!response.ok) {
        throw new Error(`${url}: ${response.status}`)
    }

    await sharp(Buffer.from(await response.arrayBuffer()))
        .resize(ICON_SIZE, ICON_SIZE, { fit: "contain" })
        .webp({ quality: 85 })
        .toFile(path)
}

const CATEGORY_IDS: Record<string, string> = {
    Cogni: "cogni",
    Fera: "fera",
    Natura: "natura",
    Varian: "varian",
    Special: "special",
}

const SOURCE_IDS: Record<AtlasPet["sourceKind"], string> = {
    field: "field",
    nonfield: "other",
    special: "special",
}

const main = async () => {
    const atlas = readAtlas(await fetchText(ATLAS_URL))
    const zoneMaps = atlas.meta.zones.map((zone) => {
        const id = PET_MAP_IDS.find((mapId) => {
            return PET_MAPS[mapId].code === zone.mapCode
        })

        if (!id) {
            throw new Error(
                `Unknown map ${zone.mapCode}; add it to petMaps.ts.`,
            )
        }

        return id
    })
    const maps = {} as Record<PetMapId, Awaited<ReturnType<typeof readRegions>>>
    const landmarks = {} as Record<PetMapId, Landmark[]>

    for (const mapId of PET_MAP_IDS) {
        const { code, size } = PET_MAPS[mapId]

        maps[mapId] = await readRegions(code)
        landmarks[mapId] = await readLandmarks(code, size)
    }

    const mapSpawns = Object.fromEntries(
        PET_MAP_IDS.map((mapId) => [mapId, [] as SpotSpawn[]]),
    ) as Record<PetMapId, SpotSpawn[]>

    for (const [key, [zone, , x, y]] of atlas.spawns.entries()) {
        const mapId = zoneMaps[zone]
        // Atlas spawns are map pixels (y down), like our tiles. The
        // Interactive Map stores region outlines with y up from the bottom.
        const area = findArea(x, PET_MAPS[mapId].size - y, maps[mapId].regions)

        mapSpawns[mapId].push({
            x: Math.round(x),
            y: Math.round(y),
            area: area,
            key: key,
        })
    }

    const spotByKey = new Map<number, number>()
    const spots = {} as Record<PetMapId, { name: string; area: number }[]>

    for (const mapId of PET_MAP_IDS) {
        // Lower Reshanta has no named landmarks, so no spots either.
        if (landmarks[mapId].length === 0) {
            spots[mapId] = []
            continue
        }

        const mapSpots = buildSpots(
            mapSpawns[mapId],
            landmarks[mapId],
            PET_MAPS[mapId].size,
        )

        for (const [index, spot] of mapSpots.entries()) {
            for (const spawn of spot.spawns) {
                spotByKey.set(spawn.key, index)
            }
        }

        spots[mapId] = mapSpots.map((spot) => {
            return { name: spot.name, area: spot.area }
        })
    }

    const spawnsByMonster = atlas.monsters.map((): number[] => [])

    for (const [key, [, , x, y, monster]] of atlas.spawns.entries()) {
        spawnsByMonster[monster].push(
            Math.round(x),
            Math.round(y),
            spotByKey.get(key) ?? -1,
        )
    }

    const icons = await readPetIcons()
    const pets = [...atlas.pets]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((pet) => {
            return {
                id: pet.id,
                name: pet.name,
                category: CATEGORY_IDS[pet.category],
                source: SOURCE_IDS[pet.sourceKind],
                icon: icons.byId.get(pet.id) ?? icons.byName.get(pet.name),
                monsters: pet.sources.flat(),
            }
        })

    for (const pet of pets) {
        if (!pet.category || !pet.source) {
            throw new Error(`Unknown category or source for ${pet.name}.`)
        }

        if (pet.icon) {
            await saveIcon(pet.icon)
        } else {
            console.warn(`No portrait for ${pet.name}; it shows its type dot.`)
        }
    }

    const monsters = atlas.monsters.map((monster, index) => {
        return {
            name: monster.name,
            level: monster.level,
            rank: monster.rank.toLowerCase(),
            map: zoneMaps[monster.zone],
            spawns: spawnsByMonster[index],
        }
    })
    const areas = Object.fromEntries(
        PET_MAP_IDS.map((mapId) => [mapId, maps[mapId].names]),
    )

    // One pet or monster per line keeps diffs readable after a refresh.
    const lines = [
        "{",
        `"patch": ${JSON.stringify(atlas.meta.client.patch)},`,
        `"client": ${JSON.stringify(atlas.meta.client.label)},`,
        `"areas": ${JSON.stringify(areas)},`,
        `"spots": ${JSON.stringify(spots)},`,
        `"pets": [`,
        pets
            .map((pet) => {
                return JSON.stringify({ ...pet, icon: pet.icon?.icon })
            })
            .join(",\n"),
        "],",
        `"monsters": [`,
        monsters.map((monster) => JSON.stringify(monster)).join(",\n"),
        "]",
        "}",
    ]

    writeFileSync(OUT_PATH, `${lines.join("\n")}\n`)
    console.log(
        `${pets.length} pets, ${monsters.length} monsters, ${atlas.spawns.length} spawns -> ${OUT_PATH}`,
    )
}

await main()
