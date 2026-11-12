import {
    readCraftingSettings,
    writeCraftingSettings,
} from "@crafting/storage/craftingSettings"
import { asGameEdit } from "@account/sync/syncMeta"
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
// the duty board; v4: progress counters; v5: arena records), so
// each is applied once more.
const APPLIED_KEY = "daevanion:game-applied:v5"
const OLD_APPLIED_KEYS = [
    "daevanion:game-applied",
    "daevanion:game-applied:v2",
    "daevanion:game-applied:v3",
    "daevanion:game-applied:v4",
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

const listSnapshots = () => {
    const stored: StoredSnapshot[] = []

    for (let index = 0; index < window.localStorage.length; index++) {
        const key = window.localStorage.key(index)

        if (key === null || !isGameKey(key)) {
            continue
        }

        try {
            const snapshot = parseGameSnapshot(
                JSON.parse(window.localStorage.getItem(key) ?? "null"),
            )

            if (snapshot !== null) {
                stored.push({ key: key, snapshot: snapshot })
            }
        } catch {
            // Not JSON: skip it.
        }
    }

    return stored
}

// Every character's latest snapshot on this device.
export const readGameSnapshots = () => {
    return listSnapshots().map((item) => item.snapshot)
}

// Every game row's key and text, joined: readers parse only when it changes.
const readGameRaw = () => {
    const raw: string[] = []

    for (let index = 0; index < window.localStorage.length; index++) {
        const key = window.localStorage.key(index)

        if (key !== null && isGameKey(key)) {
            raw.push(key, window.localStorage.getItem(key) ?? "")
        }
    }

    return raw.join("\u0000")
}

let charactersCache = { raw: "", characters: "" }

// The characters the companion has sent: `<server number>:<class
// number>:<name>` lines, sorted, as one string so useSyncExternalStore sees
// the same list as the same value. Read on every render: parsed only when a
// snapshot changed.
export const readGameCharacters = () => {
    const raw = readGameRaw()

    if (raw === charactersCache.raw) {
        return charactersCache.characters
    }

    // By server and name, as the keys sort: the class sits between them.
    const sorted = listSnapshots().sort((a, b) => a.key.localeCompare(b.key))
    const lines = sorted.map(({ key, snapshot }) => {
        const who = key.slice(GAME_KEY_PREFIX.length)
        const at = who.indexOf(":")

        return `${who.slice(0, at)}:${snapshot.character.class}:${who.slice(at + 1)}`
    })
    const characters = lines.join("\n")

    charactersCache = { raw: raw, characters: characters }

    return characters
}

// What each character's snapshot holds, as `<server number>:<name>:<section>`
// lines (crafts as `crafts.<recipe id>`), sorted, as one string so
// useSyncExternalStore sees the same content as the same value.
let sectionsCache = { raw: "", sections: "" }

export const readGameSections = () => {
    // Read on every render: parse only when a snapshot changed.
    const joined = readGameRaw()

    if (joined === sectionsCache.raw) {
        return sectionsCache.sections
    }

    const lines: string[] = []

    for (const { key, snapshot } of listSnapshots()) {
        const who = key.slice(GAME_KEY_PREFIX.length)
        const sections = [
            snapshot.pets && "pets",
            snapshot.counters && "counters",
            snapshot.items && "items",
            snapshot.supply && "supply",
            snapshot.duty && "duty",
            snapshot.arena && "arena",
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

    sectionsCache = { raw: joined, sections: sections }

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

let boardsCache: { raw: string; boards: GameBoards[] } = {
    raw: "",
    boards: [],
}

// Every character's boards, by server and name; the same array until a
// snapshot changes, so useSyncExternalStore can read it on every render.
export const readGameBoards = () => {
    const raw = readGameRaw()

    if (raw === boardsCache.raw) {
        return boardsCache.boards
    }

    const boards: GameBoards[] = []
    const sorted = listSnapshots().sort((a, b) => a.key.localeCompare(b.key))

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

    boardsCache = { raw: raw, boards: boards }

    return boards
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

    let tracker = readTrackerData()
    const trackerBefore = tracker

    for (const item of fresh) {
        tracker = applyToTracker(tracker, item.snapshot)
    }

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
        writePetCollection(applyToPets(readPetCollection(), newestPets))
    }

    if (
        fresh.some((item) => {
            return (
                item.snapshot.items !== undefined ||
                item.snapshot.professions !== undefined
            )
        })
    ) {
        writeCraftingSettings(
            applyToCrafting(
                readCraftingSettings(),
                stored.map((item) => item.snapshot),
            ),
        )
    }

    const next = { ...applied }

    for (const item of fresh) {
        next[item.key] = getSnapshotTime(item.snapshot)
    }

    writeApplied(next)
}
