import {
    readCraftingSettings,
    writeCraftingSettings,
} from "@crafting/storage/craftingSettings"
import { asGameEdit } from "@account/sync/syncMeta"
import { keepUnchanged } from "@common/keepUnchanged"
import { isRecord } from "@planner/storage/isRecord"
import {
    readPetCollection,
    writePetCollection,
} from "@pets/storage/petCollection"
import { readTrackerData, writeTrackerData } from "@tracker/storage/trackerData"
import { applyToCrafting } from "./applyToCrafting"
import { applyToPets } from "./applyToPets"
import { applyToTracker } from "./applyToTracker"
import {
    GAME_KEY_PREFIX,
    getSnapshotTime,
    isGameKey,
    parseGameSnapshot,
    type GameSnapshot,
} from "./gameSnapshot"

// Which snapshot time each game key was last applied at, on this device: an
// old snapshot never overwrites what was edited after it. Bump the version
// when the site reads more from snapshots (v2: Hidden Cube keys, crafts; v3:
// the duty board; v4: progress counters; v5: arena records; v6: Abyss
// corridors), so
// each is applied once more.
const APPLIED_KEY = "daevanion:game-applied:v6"
const OLD_APPLIED_KEYS = [
    "daevanion:game-applied",
    "daevanion:game-applied:v2",
    "daevanion:game-applied:v3",
    "daevanion:game-applied:v4",
    "daevanion:game-applied:v5",
]

type StoredSnapshot = {
    key: string
    snapshot: GameSnapshot
}

const readApplied = () => {
    try {
        const raw = window.localStorage.getItem(APPLIED_KEY)
        const value: unknown = raw === null ? null : JSON.parse(raw)

        return isRecord(value) ? (value as Record<string, number>) : {}
    } catch {
        return {}
    }
}

const writeApplied = (applied: Record<string, number>) => {
    try {
        window.localStorage.setItem(APPLIED_KEY, JSON.stringify(applied))

        for (const key of OLD_APPLIED_KEYS) {
            window.localStorage.removeItem(key)
        }
    } catch {
        // Storage is blocked: snapshots apply again next time, which is harmless.
    }
}

type ParsedRow = { raw: string; snapshot: GameSnapshot | null }

const parseSnapshot = (raw: string) => {
    try {
        return parseGameSnapshot(JSON.parse(raw))
    } catch {
        // Not JSON: skip it.
        return null
    }
}

// Each game row's text as last read, and what it parsed to. Every reader
// shares it, so a snapshot is parsed once per change, not once per reader
// and render.
let parsedRows = new Map<string, ParsedRow>()
let storedCache: StoredSnapshot[] = []

// Every stored snapshot: the same array until a game row changes, so readers
// can cache what they build from it (never sort it in place).
const listSnapshots = () => {
    const rows = new Map<string, ParsedRow>()
    let changed = false

    for (let index = 0; index < window.localStorage.length; index++) {
        const key = window.localStorage.key(index)

        if (key === null || !isGameKey(key)) {
            continue
        }

        const raw = window.localStorage.getItem(key) ?? ""
        const before = parsedRows.get(key)

        if (before !== undefined && before.raw === raw) {
            rows.set(key, before)
        } else {
            rows.set(key, { raw: raw, snapshot: parseSnapshot(raw) })
            changed = true
        }
    }

    if (!changed && rows.size === parsedRows.size) {
        return storedCache
    }

    parsedRows = rows
    storedCache = []

    for (const [key, row] of rows) {
        if (row.snapshot !== null) {
            storedCache.push({ key: key, snapshot: row.snapshot })
        }
    }

    return storedCache
}

// Every character's latest snapshot on this device.
export const readGameSnapshots = () => {
    return listSnapshots().map((item) => item.snapshot)
}

let charactersCache: { stored: StoredSnapshot[] | null; characters: string } = {
    stored: null,
    characters: "",
}

// The characters the companion has sent: `<server number>:<class
// number>:<name>` lines, sorted, as one string so useSyncExternalStore sees
// the same list as the same value. Read on every render: parsed only when a
// snapshot changed.
export const readGameCharacters = () => {
    const stored = listSnapshots()

    if (stored === charactersCache.stored) {
        return charactersCache.characters
    }

    // By server and name, as the keys sort: the class sits between them.
    const sorted = [...stored].sort((a, b) => a.key.localeCompare(b.key))
    const lines = sorted.map(({ key, snapshot }) => {
        const who = key.slice(GAME_KEY_PREFIX.length)
        const at = who.indexOf(":")

        return `${who.slice(0, at)}:${snapshot.character.class}:${who.slice(at + 1)}`
    })
    const characters = lines.join("\n")

    charactersCache = { stored: stored, characters: characters }

    return characters
}

// What each character's snapshot holds, as `<server number>:<name>:<section>`
// lines (crafts as `crafts.<recipe id>`), sorted, as one string so
// useSyncExternalStore sees the same content as the same value.
let sectionsCache: { stored: StoredSnapshot[] | null; sections: string } = {
    stored: null,
    sections: "",
}

export const readGameSections = () => {
    // Read on every render: rebuilt only when a snapshot changed.
    const stored = listSnapshots()

    if (stored === sectionsCache.stored) {
        return sectionsCache.sections
    }

    const lines: string[] = []

    for (const { key, snapshot } of stored) {
        const who = key.slice(GAME_KEY_PREFIX.length)
        const sections = [
            snapshot.pets && "pets",
            snapshot.counters && "counters",
            snapshot.items && "items",
            snapshot.supply && "supply",
            snapshot.duty && "duty",
            snapshot.arena && "arena",
            snapshot.corridorsAt !== undefined && "corridors",
            snapshot.professions && "professions",
            ...Object.keys(snapshot.crafts ?? {}).map((id) => `crafts.${id}`),
        ]

        for (const section of sections) {
            if (section) {
                lines.push(`${who}:${section}`)
            }
        }
    }

    const sections = lines.sort((a, b) => a.localeCompare(b)).join("\n")

    sectionsCache = { stored: stored, sections: sections }

    return sections
}

// A character's Daevanion boards as the game last sent them.
export type GameBoards = {
    name: string
    // The game's server and class numbers.
    server: number
    class: number
    at: number
    boards: Record<string, number[]>
}

let boardsCache: { stored: StoredSnapshot[] | null; boards: GameBoards[] } = {
    stored: null,
    boards: [],
}

// Every character's boards, by server and name; the same array until a
// character's boards change (items and counters change far more often), so
// useSyncExternalStore can read it on every render.
export const readGameBoards = () => {
    const stored = listSnapshots()

    if (stored === boardsCache.stored) {
        return boardsCache.boards
    }

    const boards: GameBoards[] = []
    const sorted = [...stored].sort((a, b) => a.key.localeCompare(b.key))

    for (const { snapshot } of sorted) {
        if (snapshot.boards) {
            boards.push({
                name: snapshot.character.name,
                server: snapshot.character.server,
                class: snapshot.character.class,
                at: snapshot.boardsAt ?? 0,
                boards: snapshot.boards,
            })
        }
    }

    boardsCache = {
        stored: stored,
        boards: keepUnchanged(boardsCache.boards, boards),
    }

    return boardsCache.boards
}

// Calls back when a snapshot arrives or changes.
export const subscribeToGameSnapshots = (onChange: () => void) => {
    const handleStorage = (event: StorageEvent) => {
        if (event.key === null || isGameKey(event.key)) {
            onChange()
        }
    }

    window.addEventListener("storage", handleStorage)

    return () => {
        window.removeEventListener("storage", handleStorage)
    }
}

const getNewestPets = (stored: StoredSnapshot[]) => {
    let newest: GameSnapshot | null = null

    for (const item of stored) {
        const snapshot = item.snapshot

        if (
            snapshot.pets !== undefined &&
            (newest === null || (snapshot.petsAt ?? 0) > (newest.petsAt ?? 0))
        ) {
            newest = snapshot
        }
    }

    return newest
}

// Applies every snapshot newer than the one applied last. Cloud sync calls it
// once a pull has written everything (never midway: the account's older copy
// of the tracker, pets or crafting would land on top), and at start. Its
// saves are game edits: another device's copy replaces them without a
// conflict, then reapplyGameSnapshotsSince puts back what it may lack.
export const applyGameSnapshots = () => {
    asGameEdit(applyFresh)
}

// After taking the account's copy over this device's game edits: snapshots
// newer than the last version both sides agreed on (`time`) apply again,
// on the next applyGameSnapshots.
export const reapplyGameSnapshotsSince = (time: number) => {
    const applied = readApplied()
    const next = { ...applied }

    for (const [key, at] of Object.entries(applied)) {
        if (at > time) {
            next[key] = time
        }
    }

    writeApplied(next)
}

// Applies one character's snapshot again, e.g. once the user added that
// character to the tracker (`key`: "<server number>:<name>").
export const reapplyGameSnapshot = (key: string) => {
    const applied = readApplied()

    writeApplied({ ...applied, [GAME_KEY_PREFIX + key]: 0 })
    applyGameSnapshots()
}

const applyFresh = () => {
    const applied = readApplied()
    const stored = listSnapshots()
    const fresh = stored
        .filter((item) => {
            return getSnapshotTime(item.snapshot) > (applied[item.key] ?? 0)
        })
        .sort((a, b) => {
            return getSnapshotTime(a.snapshot) - getSnapshotTime(b.snapshot)
        })

    if (fresh.length === 0) {
        return
    }

    // Applying rebuilds parts even when their values stay the same: keep
    // those, so only what the game changed re-renders (and nothing is
    // written when nothing changed).
    const trackerBefore = readTrackerData()
    let tracker = trackerBefore

    for (const item of fresh) {
        tracker = applyToTracker(tracker, item.snapshot)
    }

    tracker = keepUnchanged(trackerBefore, tracker)

    if (tracker !== trackerBefore) {
        writeTrackerData(tracker)
    }

    // Pets are the account's: only the newest list counts, and only when
    // it's one of the new ones.
    const newestPets = getNewestPets(stored)

    if (
        newestPets !== null &&
        fresh.some((item) => item.snapshot === newestPets)
    ) {
        const pets = readPetCollection()
        const nextPets = keepUnchanged(pets, applyToPets(pets, newestPets))

        if (nextPets !== pets) {
            writePetCollection(nextPets)
        }
    }

    if (
        fresh.some((item) => {
            return (
                item.snapshot.items !== undefined ||
                item.snapshot.professions !== undefined
            )
        })
    ) {
        const settings = readCraftingSettings()
        const nextSettings = keepUnchanged(
            settings,
            applyToCrafting(
                settings,
                stored.map((item) => item.snapshot),
            ),
        )

        if (nextSettings !== settings) {
            writeCraftingSettings(nextSettings)
        }
    }

    const next = { ...applied }

    for (const item of fresh) {
        next[item.key] = getSnapshotTime(item.snapshot)
    }

    writeApplied(next)
}
