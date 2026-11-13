// Rebuilds companion/internal/shop/petitems.json and the pet portraits beside
// it (icons/<portrait>.png, from src/assets/pets): npm run pets:shop
// Shops sell pets as items ("Pet: Basilisk": grants the pet, or its souls when
// owned). The companion's shop panel needs each such item's pet and where the
// pet spawns in the wild. Item names come from AION 2 Hub's item database
// (the crafting data's source, credited on the Crafting page), pets and their
// continents from our Pet Atlas data (npm run pets:data first). The pets
// matched by name, so a pet the Atlas only has a placeholder (negative) id
// for keeps it: the companion can't look up its souls.
// Downloaded pages are cached in the OS temp folder, so a rerun only fetches
// pages it hasn't seen; pass --fresh to download everything again.
import {
    existsSync,
    mkdirSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import sharp from "sharp"

const SITE = "https://aion2hub.com"
const SITEMAP_URL = `${SITE}/sitemap.xml`
// Pet items are numbered 534760001 on.
const ITEM_URL = /\/database\/items\/(53476\d{4})$/
const ATLAS_PATH = join(process.cwd(), "src/features/pets/data/petAtlas.json")
const OUT_PATH = join(process.cwd(), "companion/internal/shop/petitems.json")
const ICON_SOURCE_DIR = join(process.cwd(), "src/assets/pets")
const ICON_DIR = join(process.cwd(), "companion/internal/shop/icons")
// The panel draws them at 40px; 64 stays sharp up to 150% display scaling.
// The companion has no .webp decoder, so they're PNGs (palette: ~4 KB each).
const ICON_SIZE = 64
const CACHE_DIR = join(tmpdir(), "daevanion-pet-item-pages")
const USER_AGENT = "Mozilla/5.0 (compatible; fan-site data script)"
// Kept low so the script never loads the site much.
const PAUSE_MS = 250
// The Pets page's map order (PET_MAP_IDS).
const MAP_ORDER = ["verteron", "reshanta", "altgard"]

type AtlasPet = {
    id: number
    name: string
    category: string
    icon?: string
    monsters: number[]
}
type AtlasMonster = { map: string; spawns: number[] }
type Atlas = { pets: AtlasPet[]; monsters: AtlasMonster[] }

type PetItem = {
    pet: number
    name: string
    // Its type: cogni, fera, natura, varian, special (the Pets page's).
    category: string
    icon?: string
    maps: string[]
}

const sleep = (ms: number) => {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

const decodeEntities = (text: string) => {
    return text
        .replace(/&#x27;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
}

const fetchText = async (url: string) => {
    for (let attempt = 1; ; attempt++) {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT },
        })

        if (response.ok) {
            return response.text()
        }

        if (attempt >= 3) {
            throw new Error(`${url}: HTTP ${response.status}`)
        }

        await sleep(2000 * attempt)
    }
}

const getItemIds = async () => {
    const sitemap = await fetchText(SITEMAP_URL)
    const ids: number[] = []

    for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const id = ITEM_URL.exec(match[1])?.[1]

        if (id) {
            ids.push(Number(id))
        }
    }

    return ids.sort((a, b) => a - b)
}

const getPage = async (id: number) => {
    const file = join(CACHE_DIR, `${id}.html`)

    if (existsSync(file)) {
        return readFileSync(file, "utf8")
    }

    const html = await fetchText(`${SITE}/database/items/${id}`)

    writeFileSync(file, html)
    await sleep(PAUSE_MS)

    return html
}

// "Pet: Basilisk — AION 2 Item Database | AION2 Hub" → "Basilisk".
const getPetName = (html: string) => {
    const title = /<title>([^<]*)<\/title>/.exec(html)?.[1]
    const name = title && /^Pet: (.+?) — /.exec(decodeEntities(title))?.[1]

    return name ?? null
}

// The continents a pet's soul monsters spawn on, in the Pets page's order.
const getMaps = (pet: AtlasPet, monsters: AtlasMonster[]) => {
    const maps = new Set<string>()

    for (const index of pet.monsters) {
        const monster = monsters[index]

        if (monster && monster.spawns.length > 0) {
            maps.add(monster.map)
        }
    }

    return MAP_ORDER.filter((map) => maps.has(map))
}

// Saves each portrait the items use; returns the ones it found.
const writeIcons = async (icons: Set<string>) => {
    rmSync(ICON_DIR, { recursive: true, force: true })
    mkdirSync(ICON_DIR, { recursive: true })

    const found = new Set<string>()

    for (const icon of icons) {
        const source = join(ICON_SOURCE_DIR, `${icon}.webp`)

        if (!existsSync(source)) {
            console.warn(`No portrait ${source}`)
            continue
        }

        await sharp(source)
            .resize(ICON_SIZE, ICON_SIZE, { fit: "cover" })
            .png({ compressionLevel: 9, palette: true })
            .toFile(join(ICON_DIR, `${icon}.png`))
        found.add(icon)
    }

    return found
}

const main = async () => {
    if (process.argv.includes("--fresh")) {
        rmSync(CACHE_DIR, { recursive: true, force: true })
    }

    mkdirSync(CACHE_DIR, { recursive: true })

    const atlas = JSON.parse(readFileSync(ATLAS_PATH, "utf8")) as Atlas
    const petsByName = new Map<string, AtlasPet>()

    for (const pet of atlas.pets) {
        petsByName.set(pet.name.toLowerCase(), pet)
    }

    const ids = await getItemIds()
    const items: [number, PetItem][] = []
    const unknown: string[] = []

    console.log(`Reading ${ids.length} item pages...`)

    for (const id of ids) {
        const name = getPetName(await getPage(id))

        if (!name) {
            continue
        }

        const pet = petsByName.get(name.toLowerCase())

        if (!pet) {
            unknown.push(`${id} ${name}`)
            continue
        }

        items.push([
            id,
            {
                pet: pet.id,
                name: pet.name,
                category: pet.category,
                icon: pet.icon,
                maps: getMaps(pet, atlas.monsters),
            },
        ])
    }

    const icons = await writeIcons(
        new Set(items.flatMap(([, item]) => (item.icon ? [item.icon] : []))),
    )

    for (const [, item] of items) {
        if (item.icon && !icons.has(item.icon)) {
            delete item.icon
        }
    }

    console.log(`Wrote ${icons.size} portraits to ${ICON_DIR}`)

    const lines = items.map(([id, item]) => {
        return `"${id}":${JSON.stringify(item)}`
    })

    writeFileSync(OUT_PATH, `{\n${lines.join(",\n")}\n}\n`)
    console.log(`Wrote ${items.length} pet items to ${OUT_PATH}`)

    if (unknown.length > 0) {
        console.warn(
            `No Pet Atlas pet named like these (Global client pets only?):\n  ${unknown.join("\n  ")}`,
        )
    }
}

await main()
