// Rebuilds src/features/crafting/data/recipes.json: npm run crafting:data
// Crafting success chances by proficiency level difference come from NCSOFT's
// official probability page (Korean disclosure, matching the Global client),
// matched to our recipes by translated name (craftingChanceNames.ts).
// Recipes come from AION 2 Hub's crafting calculator pages (credited on the
// page), which it reads from the game data. Only recipes in the Global client
// are kept; KR/TW-only ones and the quest's profession tools are left out. Item icons (© NCSOFT) come from the
// same site and are saved as src/assets/crafting/<item id>.webp.
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
import { translateChanceName } from "./craftingChanceNames.ts"

const SITE = "https://aion2hub.com"
const SITEMAP_URL = `${SITE}/sitemap.xml`
const RECIPE_PATH = "/tools/crafting-calculator/"
const OUT_PATH = join(process.cwd(), "src/features/crafting/data/recipes.json")
const ICON_DIR = join(process.cwd(), "src/assets/crafting")
const CACHE_DIR = join(tmpdir(), "daevanion-crafting-pages")
const USER_AGENT = "Mozilla/5.0 (compatible; fan-site data script)"
// Shown at up to 32px; double that for sharp high-DPI screens.
const ICON_SIZE = 64
// Kept low so the script never loads the site much.
const CONCURRENCY = 3
const PAUSE_MS = 250
// The site's profession names, as ids of the game's (Tailoring is the game's
// Armorsmithing, Jewelcrafting its Handicrafting).
const PROFESSIONS: Record<string, string> = {
    Blacksmithing: "blacksmithing",
    Tailoring: "armorsmithing",
    Jewelcrafting: "handicrafting",
    Alchemy: "alchemy",
    Cooking: "cooking",
}
// The game's crafting tabs, by the item's internal key (the site's calculator
// link names it). "drop": left out of the data; "none": only under All.
// Profession tools are for a one-off quest; drinks aren't in Cooking's Food tab.
const KEY_CATEGORIES: [RegExp, string][] = [
    [/^Elevate_Craft_/, "drop"],
    [/^equip_wp_Greatsword_/, "greatsword"],
    [/^equip_wp_Sword_/, "longsword"],
    [/^equip_wp_Dagger_/, "dagger"],
    [/^equip_wp_Mace_/, "mace"],
    [/^equip_wp_Guarder_/, "guard"],
    [/^equip_ar_Helmet_/, "helm"],
    [/^equip_ar_Shoulder_/, "pauldrons"],
    [/^equip_ar_Torso_/, "top"],
    [/^equip_ar_Pants_/, "legs"],
    [/^equip_ar_Gloves_/, "gloves"],
    [/^equip_ar_Boots_/, "shoes"],
    [/^equip_ar_Cape_/, "cloak"],
    [/^equip_wp_Bow_/, "bow"],
    [/^equip_wp_Staff_/, "staff"],
    [/^equip_acc_Necklace_/, "necklace"],
    [/^equip_acc_Earring_/, "earrings"],
    [/^equip_acc_Ring_/, "ring"],
    [/^equip_acc_Bracelet_/, "bracelet"],
    [/^equip_wp_Magicbook_/, "spellbook"],
    [/^equip_wp_Orb_/, "orb"],
    [/^Potion_/, "potion"],
    [/^Scroll_/, "scroll"],
    // Soulstones share the Manastone tab.
    [/^(MagicStone|SpiritStone)/, "manastone"],
    [/^Material_/, "materials"],
    [/^Food_/, "food"],
    [/^Drink_/, "none"],
]
// A key's faction part: L(ight) is Elyos, D(ark) Asmodian, A both.
const KEY_FACTIONS: Record<string, string | null> = {
    L: "elyos",
    D: "asmodians",
    A: null,
}

// Transfer Crafting starts from a piece of gear (the game's "Transfer
// Material", first in its list) that the site leaves out. By the item key's
// end: the key of the piece it's made from, of the same gear and faction.
// True → Splendent True → White → Splendent White → Wise → Splendent Wise
// (Star, Dark, Ebony for Asmodians); checked in game for Greatswords.
const TRANSFER_SOURCES: Record<string, string> = {
    craftdraconicCombo_005a_s: "craftdraconic_001a_s",
    craftdraconic_007a_s: "craftdraconicCombo_005a_s",
    craftdraconicCombo_006a_s: "craftdraconic_007a_s",
    craftdraconic_008a_s: "craftdraconicCombo_006a_s",
    craftdraconicCombo_007a_s: "craftdraconic_008a_s",
}

// Item names are drawn in their grade's color; materials have no grade text,
// so each recipe page's own "Grade:" chip teaches which color is which grade.
type ParsedItem = {
    id: number
    name: string
    color: string
}

// A Splendent item procs when its base item is crafted. "only": it can't be
// crafted directly; else it has a recipe of its own too.
type ParsedCombo = {
    base: number
    chance: number
    only: boolean
}

type ParsedRecipe = {
    item: ParsedItem
    grade: string
    global: boolean
    profession: string
    // A tab of the profession, or "none" (only under All), or "drop"; null
    // when the item key is a new kind.
    category: string | null
    // The site's calculator key, e.g. "equip_wp_Mace_L_e_craftdraconic_001a_s".
    key: string
    // Only that faction's players see it; null is both.
    faction: string | null
    // Some combo recipes list none.
    mastery: number | null
    yield: number
    variants: number
    materials: { item: ParsedItem; count: number }[]
    combo: ParsedCombo | null
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

const fetchResponse = async (url: string) => {
    for (let attempt = 1; ; attempt++) {
        const response = await fetch(url, {
            headers: { "User-Agent": USER_AGENT },
        })

        if (response.ok || response.status === 404 || attempt >= 3) {
            return response
        }

        await sleep(2000 * attempt)
    }
}

const fetchText = async (url: string) => {
    const response = await fetchResponse(url)

    if (!response.ok) {
        throw new Error(`${url}: HTTP ${response.status}`)
    }

    return response.text()
}

const getRecipeUrls = async () => {
    const sitemap = await fetchText(SITEMAP_URL)
    const urls: string[] = []

    for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) {
        const url = match[1]

        if (url.includes(RECIPE_PATH) && /-\d+$/.test(url)) {
            urls.push(url)
        }
    }

    return urls
}

const getPage = async (url: string) => {
    const file = join(CACHE_DIR, `${url.split("/").pop()}.html`)

    if (existsSync(file)) {
        return readFileSync(file, "utf8")
    }

    const html = await fetchText(url)

    writeFileSync(file, html)
    await sleep(PAUSE_MS)

    return html
}

const getChip = (html: string, label: string) => {
    const match = html.match(new RegExp(`${label}: <span[^>]*>([^<]+)</span>`))

    return match ? decodeEntities(match[1]) : null
}

const parseMaterials = (html: string) => {
    const start = html.indexOf("recipe — direct components</h2>")
    const end = html.indexOf("</ul>", start)

    if (start < 0 || end < 0) {
        return null
    }

    const list = html.slice(start, end)
    const materials: ParsedRecipe["materials"] = []
    const pattern =
        /href="\/database\/items\/(\d+)"><span[^>]*style="color:(#[0-9a-fA-F]+)">([^<]+)<\/span>.*?×([\d,]+)<\/span>/g

    for (const match of list.matchAll(pattern)) {
        materials.push({
            item: {
                id: Number(match[1]),
                name: decodeEntities(match[3]),
                color: match[2].toLowerCase(),
            },
            count: Number(match[4].replace(/,/g, "")),
        })
    }

    return materials
}

const parseCombo = (id: number, html: string): ParsedCombo | null => {
    const match = html.match(
        /combo craft:<\/span>(.*?)with a\s*(\d+(?:\.\d+)?)% chance each time you craft\s*<a[^>]*href="[^"]*-(\d+)"/,
    )

    if (!match) {
        return null
    }

    const base = Number(match[3])

    // Some pages say an item procs from crafting itself; that says nothing.
    if (base === id) {
        return null
    }

    return {
        base: base,
        chance: Number(match[2]),
        only: match[1].includes("not crafted directly"),
    }
}

const parseRecipe = (url: string, raw: string): ParsedRecipe => {
    const html = raw.replace(/<!-- -->/g, "")
    const id = Number(url.match(/-(\d+)$/)?.[1])
    const title = html.match(/<h1[^>]*>([^<]+) — Crafting Recipe/)
    const grade = html.match(
        /Grade: <span style="color:(#[0-9a-fA-F]+)">([^<]+)</,
    )
    const profession = PROFESSIONS[getChip(html, "Profession") ?? ""]
    const mastery = getChip(html, "Mastery level")
    const yieldText = getChip(html, "Yield per craft")
    const variants = html.match(/>(\d+) recipe variants</)
    const materials = parseMaterials(html)
    const key = html.match(/crafting-calculator\?item=([^&"]+)/)?.[1] ?? ""
    const category = KEY_CATEGORIES.find(([pattern]) => pattern.test(key))
    const factionPart = key.split("_").find((part) => part in KEY_FACTIONS)

    if (!title || !grade || !profession || !materials?.length) {
        throw new Error(`${url}: page layout not recognised`)
    }

    return {
        item: {
            id: id,
            name: decodeEntities(title[1]),
            color: grade[1].toLowerCase(),
        },
        grade: decodeEntities(grade[2]).toLowerCase(),
        global: !html.includes("Not in the Global client"),
        profession: profession,
        category: category?.[1] ?? null,
        faction: factionPart ? KEY_FACTIONS[factionPart] : null,
        key: key,
        mastery: mastery ? Number(mastery) : null,
        yield: yieldText ? Number(yieldText) : 1,
        variants: variants ? Number(variants[1]) : 1,
        materials: materials,
        combo: parseCombo(id, html),
    }
}

const runPool = async <T, R>(
    values: T[],
    work: (value: T, index: number) => Promise<R>,
) => {
    const results: R[] = new Array(values.length)
    let next = 0

    const worker = async () => {
        while (next < values.length) {
            const index = next++

            results[index] = await work(values[index], index)
        }
    }

    await Promise.all(Array.from({ length: CONCURRENCY }, worker))

    return results
}

// Saves the icons not saved yet; returns the ids the site has no icon for.
const saveIcons = async (ids: number[]) => {
    mkdirSync(ICON_DIR, { recursive: true })

    const missing = ids.filter((id) => {
        return !existsSync(join(ICON_DIR, `${id}.webp`))
    })
    const failed: number[] = []

    console.log(`Downloading ${missing.length} icons`)

    await runPool(missing, async (id) => {
        const response = await fetchResponse(`${SITE}/api/icon/items/${id}`)

        if (!response.ok) {
            failed.push(id)

            return
        }

        const image = Buffer.from(await response.arrayBuffer())

        await sharp(image)
            .resize(ICON_SIZE, ICON_SIZE, { fit: "inside" })
            .webp({ quality: 85 })
            .toFile(join(ICON_DIR, `${id}.webp`))
        await sleep(PAUSE_MS)
    })

    return failed
}

const CHANCE_API = "https://probability.plaync.com/api/aion2"
const CHANCE_CATEGORY = "제작"
const ELYOS = "천족"
const ASMODIANS = "마족"
const NORMAL = "일반"

type ChanceEntry = Record<string, unknown>

type ChanceRecord = {
    name: string
    faction: string
    yield: number
    // Percent by level difference, up to the last one the recipe reaches.
    chances: number[]
}

type ChanceRow = Record<string, unknown> & { "@entries"?: ChanceEntry[] }

const fetchJson = async (url: string, headers: Record<string, string> = {}) => {
    const response = await fetch(url, {
        headers: { "User-Agent": USER_AGENT, ...headers },
    })

    if (!response.ok) {
        throw new Error(`${url}: HTTP ${response.status}`)
    }

    return response.json()
}

// The normal (not combo) entry's chances: "레벨 차이 N" as "12.345678%",
// null past the highest difference the recipe can reach.
const readChances = (entry: ChanceEntry) => {
    const chances: number[] = []

    for (let difference = 0; ; difference++) {
        const value = entry[`레벨 차이 ${difference}`]

        if (typeof value !== "string") {
            break
        }

        chances.push(Number(value.replace("%", "")))
    }

    // A flat end is kept once; the app uses the last value beyond.
    while (
        chances.length > 1 &&
        chances[chances.length - 1] === chances[chances.length - 2]
    ) {
        chances.pop()
    }

    return chances
}

// Every row of the crafting table, cached per published version.
const getChanceRecords = async (): Promise<ChanceRecord[]> => {
    const [{ version }] = await fetchJson(`${CHANCE_API}/versions`)
    const file = join(CACHE_DIR, `chances-${version}.json`)

    if (existsSync(file)) {
        return JSON.parse(readFileSync(file, "utf8"))
    }

    const categories = await fetchJson(`${CHANCE_API}/categories`)
    const category = categories.find((item: { name: string }) => {
        return item.name === CHANCE_CATEGORY
    })
    const [contents] = await fetchJson(
        `${CHANCE_API}/contents/${category.id}?version=${version}`,
    )
    const records: ChanceRecord[] = []

    for (let page = 1; ; page++) {
        const result = await fetchJson(
            `${CHANCE_API}/resources?version=${version}&page=${page}`,
            { "Resource-Token": contents.resourceToken },
        )

        for (const row of result.records as ChanceRow[]) {
            const entries = row["@entries"] ?? [row]
            const normal =
                entries.find((entry) => entry["콤보여부"] === NORMAL) ??
                entries[0]

            records.push({
                name: String(row["아이템 이름"]),
                faction: String(row["종족"]),
                yield: Number(row["제작 결과 수량"]),
                chances: readChances(normal),
            })
        }

        if (page >= result.pageNavigation.lastPage) {
            break
        }

        await sleep(PAUSE_MS)
    }

    writeFileSync(file, JSON.stringify(records))

    return records
}

// The table row for a recipe: same English name and faction (Elyos for one
// both factions craft), same output when a name has several rows.
const findChanceRecord = (
    records: ChanceRecord[],
    name: string,
    faction: string | null,
    recipeYield: number,
) => {
    const factionKo = faction === "asmodians" ? ASMODIANS : ELYOS
    const matches = records.filter((record) => {
        return (
            record.faction === factionKo &&
            translateChanceName(record.name) === name
        )
    })

    return matches.find((record) => record.yield === recipeYield) ?? matches[0]
}

const main = async () => {
    if (process.argv.includes("--fresh")) {
        rmSync(CACHE_DIR, { recursive: true, force: true })
    }

    mkdirSync(CACHE_DIR, { recursive: true })

    const urls = await getRecipeUrls()

    console.log(`${urls.length} recipe pages (cache: ${CACHE_DIR})`)

    const recipes = await runPool(urls, async (url, index) => {
        if (index % 200 === 0) {
            console.log(`  ${index}/${urls.length}`)
        }

        return parseRecipe(url, await getPage(url))
    })
    const kept = recipes.filter((recipe) => {
        return recipe.global && recipe.category !== "drop"
    })

    // New kinds of Global items need a tab picked by hand.
    for (const recipe of kept) {
        if (recipe.category === null || !recipe.key.match(/_[LDA]_/)) {
            throw new Error(
                `${recipe.item.name}: no tab or faction for item key "${recipe.key}"`,
            )
        }
    }

    const byKey = new Map(kept.map((recipe) => [recipe.key, recipe]))

    // Each Transfer Crafting recipe gets its transfer material first.
    for (const recipe of kept) {
        if (recipe.mastery !== null) {
            continue
        }

        const end = Object.keys(TRANSFER_SOURCES).find((suffix) => {
            return recipe.key.endsWith(suffix)
        })
        const source = end
            ? byKey.get(
                  recipe.key.slice(0, -end.length) + TRANSFER_SOURCES[end],
              )
            : undefined

        if (!source) {
            throw new Error(
                `${recipe.item.name}: no transfer material for item key "${recipe.key}"`,
            )
        }

        recipe.materials.unshift({ item: source.item, count: 1 })
    }
    const gradeColors = new Map<string, string>()
    const items = new Map<number, ParsedItem>()
    const unknownColors = new Set<string>()

    for (const recipe of recipes) {
        gradeColors.set(recipe.item.color, recipe.grade)
    }

    for (const recipe of kept) {
        items.set(recipe.item.id, recipe.item)

        for (const material of recipe.materials) {
            if (!items.has(material.item.id)) {
                items.set(material.item.id, material.item)
            }
        }
    }

    const getGrade = (item: ParsedItem) => {
        const grade = gradeColors.get(item.color)

        if (!grade) {
            unknownColors.add(item.color)
        }

        return grade ?? null
    }

    const sortedItems = [...items.values()].sort((a, b) => a.id - b.id)
    const sortedRecipes = kept.sort((a, b) => a.item.id - b.item.id)
    const chanceRecords = await getChanceRecords()
    const chanceTables: number[][] = []
    const chanceIndex = new Map<string, number>()
    const recipeChances = new Map<number, number>()
    const unmatched: string[] = []

    // Shared curves are stored once, recipes point at them by index.
    const addTable = (chances: number[]) => {
        const key = chances.join()
        let index = chanceIndex.get(key)

        if (index === undefined) {
            index = chanceTables.length
            chanceTables.push(chances)
            chanceIndex.set(key, index)
        }

        return index
    }

    for (const recipe of sortedRecipes) {
        // Transfers always succeed; a combo item crafts by its base's chances.
        if (recipe.mastery === null) {
            continue
        }

        const source = recipe.combo?.only
            ? kept.find((other) => other.item.id === recipe.combo?.base)
            : recipe
        const record =
            source &&
            findChanceRecord(
                chanceRecords,
                source.item.name,
                source.faction,
                source.yield,
            )

        if (record && record.chances.length > 0) {
            recipeChances.set(recipe.item.id, addTable(record.chances))
        } else {
            unmatched.push(recipe.item.name)
        }
    }

    const failedIcons = await saveIcons(sortedItems.map((item) => item.id))
    const lines = [
        "{",
        `"fetched": ${JSON.stringify(new Date().toISOString().slice(0, 10))},`,
        '"items": [',
        sortedItems
            .map((item) => {
                return JSON.stringify([item.id, item.name, getGrade(item)])
            })
            .join(",\n"),
        "],",
        '"chanceTables": [',
        chanceTables.map((chances) => JSON.stringify(chances)).join(",\n"),
        "],",
        '"recipes": [',
        sortedRecipes
            .map((recipe) => {
                return JSON.stringify({
                    id: recipe.item.id,
                    profession: recipe.profession,
                    category:
                        recipe.category === "none"
                            ? undefined
                            : recipe.category,
                    faction: recipe.faction ?? undefined,
                    // The game's Transfer Crafting window lists the recipes
                    // with no level (user-checked).
                    transfer: recipe.mastery === null ? true : undefined,
                    mastery: recipe.mastery ?? undefined,
                    yield: recipe.yield,
                    variants: recipe.variants,
                    materials: recipe.materials.map((material) => {
                        return [material.item.id, material.count]
                    }),
                    combo: recipe.combo ?? undefined,
                    chances: recipeChances.get(recipe.item.id),
                })
            })
            .join(",\n"),
        "]",
        "}",
    ]

    mkdirSync(join(OUT_PATH, ".."), { recursive: true })
    writeFileSync(OUT_PATH, `${lines.join("\n")}\n`)
    console.log(
        `Wrote ${sortedRecipes.length} Global recipes (${recipes.length - kept.length} KR/TW-only or tools left out), ${sortedItems.length} items`,
    )
    console.log(
        `Grades: ${[...gradeColors].map(([color, grade]) => `${grade} ${color}`).join(", ")}`,
    )

    console.log(
        `Crafting chances: ${recipeChances.size} recipes, ${chanceTables.length} distinct tables`,
    )

    if (unmatched.length) {
        console.warn(
            `No crafting chances (KR table has no such name): ${[...new Set(unmatched)].join(", ")}`,
        )
    }

    if (failedIcons.length) {
        console.warn(`No icon for: ${failedIcons.join(", ")}`)
    }

    if (unknownColors.size) {
        console.warn(`Unknown grade colors: ${[...unknownColors].join(", ")}`)
    }
}

await main()
