import { isRecord } from "@planner/storage/isRecord"

// The companion app uploads one of these per character, under
// `daevanion:game:v1:<server number>:<name>`. The site only reads them.
export const GAME_KEY_PREFIX = "daevanion:game:v1:"

export const isGameKey = (key: string) => {
    return key.startsWith(GAME_KEY_PREFIX)
}

export type GameCharacter = {
    name: string
    // The game's server number: 1301-1323 Elyos, 2301-2323 Asmodians.
    server: number
    // The game's class number (see gameIds).
    class: number
}

// One supply request tab: kind 1 is Emergency (daily), 2 Weekly.
type GameSupply = {
    kind: number
    start: number
    end: number
    cards: number
    delivered: number
}

// What the game last said about one character. Each section is missing until
// the game sent it; its `…At` is when (ms).
export type GameSnapshot = {
    character: GameCharacter
    // Pet id → [Insight level 0-3, souls towards the next level].
    pets?: Record<string, [number, number]>
    petsAt?: number
    // Storage code → item id → count (see gameIds). Soulbound items, which
    // can't go to Server Storage, are in `bound` instead.
    items?: Record<string, Record<string, number>>
    bound?: Record<string, Record<string, number>>
    itemsAt?: number
    // Counter id → [recharged, bonus]; counters at 0 are left out.
    counters?: Record<string, [number, number]>
    countersAt?: number
    supply?: GameSupply[]
    supplyAt?: number
    // Recipe id → [server-wide count, character count, read at (ms)] for
    // recipes with a weekly limit, counted in the week of that time.
    crafts?: Record<string, [number, number, number]>
    craftsAt?: number
    // Profession number (gameIds GAME_PROFESSIONS) → proficiency level,
    // counted like the site's (61 is Professional Lv. 11).
    professions?: Record<string, number>
    professionsAt?: number
    // Board number (gameIds GAME_BOARDS) → acquired cells, numbered 1-225 row
    // by row in a 15 x 15 grid the board sits centered in. Sent at login and
    // character switch.
    boards?: Record<string, number[]>
    boardsAt?: number
    // The daily duty board: [quests turned in, expires at (ms)]. Past its
    // expiry it's yesterday's board.
    duty?: [number, number]
    dutyAt?: number
    // Progress counters changed in the 8 days before progressAt: id →
    // [count, last change (ms)]. One missing wasn't counted lately.
    progress?: Record<string, [number, number]>
    progressAt?: number
    // Arena mode (gameIds ARENA_TASKS) → lifetime [wins, losses].
    arena?: Record<string, [number, number]>
    arenaAt?: number
}

const isCount = (value: unknown): value is number => {
    return typeof value === "number" && Number.isInteger(value) && value >= 0
}

const isPair = (value: unknown): value is [number, number] => {
    return Array.isArray(value) && value.length === 2 && value.every(isCount)
}

const pickPairs = (value: unknown) => {
    const pairs: Record<string, [number, number]> = {}

    if (!isRecord(value)) {
        return undefined
    }

    for (const [id, pair] of Object.entries(value)) {
        if (isPair(pair)) {
            pairs[id] = pair
        }
    }

    return pairs
}

const isTriple = (value: unknown): value is [number, number, number] => {
    return Array.isArray(value) && value.length === 3 && value.every(isCount)
}

const pickTriples = (value: unknown) => {
    const triples: Record<string, [number, number, number]> = {}

    if (!isRecord(value)) {
        return undefined
    }

    for (const [id, triple] of Object.entries(value)) {
        if (isTriple(triple)) {
            triples[id] = triple
        }
    }

    return triples
}

const pickLevels = (value: unknown) => {
    const levels: Record<string, number> = {}

    if (!isRecord(value)) {
        return undefined
    }

    for (const [id, level] of Object.entries(value)) {
        if (isCount(level) && level > 0) {
            levels[id] = level
        }
    }

    return levels
}

const isCell = (value: unknown) => {
    return isCount(value) && value >= 1 && value <= 225
}

const pickBoards = (value: unknown) => {
    const boards: Record<string, number[]> = {}

    if (!isRecord(value)) {
        return undefined
    }

    for (const [board, cells] of Object.entries(value)) {
        if (Array.isArray(cells)) {
            boards[board] = cells.filter(isCell)
        }
    }

    return boards
}

const pickItems = (value: unknown) => {
    const items: Record<string, Record<string, number>> = {}

    if (!isRecord(value)) {
        return undefined
    }

    for (const [storage, counts] of Object.entries(value)) {
        if (!isRecord(counts)) {
            continue
        }

        const picked: Record<string, number> = {}

        for (const [id, count] of Object.entries(counts)) {
            if (isCount(count)) {
                picked[id] = count
            }
        }

        items[storage] = picked
    }

    return items
}

const isSupply = (value: unknown): value is GameSupply => {
    return (
        isRecord(value) &&
        isCount(value.kind) &&
        isCount(value.start) &&
        isCount(value.end) &&
        isCount(value.cards) &&
        isCount(value.delivered)
    )
}

const pickTime = (value: unknown) => {
    return isCount(value) && value > 0 ? value : undefined
}

// Null when it isn't a snapshot this version of the site understands.
export const parseGameSnapshot = (value: unknown): GameSnapshot | null => {
    if (!isRecord(value) || value.v !== 1 || !isRecord(value.character)) {
        return null
    }

    const character = value.character

    if (
        typeof character.name !== "string" ||
        character.name === "" ||
        !isCount(character.server) ||
        !isCount(character.class)
    ) {
        return null
    }

    return {
        character: {
            name: character.name,
            server: character.server,
            class: character.class,
        },
        pets: pickPairs(value.pets),
        petsAt: pickTime(value.petsAt),
        items: pickItems(value.items),
        bound: pickItems(value.bound),
        itemsAt: pickTime(value.itemsAt),
        counters: pickPairs(value.counters),
        countersAt: pickTime(value.countersAt),
        supply: Array.isArray(value.supply)
            ? value.supply.filter(isSupply)
            : undefined,
        supplyAt: pickTime(value.supplyAt),
        crafts: pickTriples(value.crafts),
        craftsAt: pickTime(value.craftsAt),
        professions: pickLevels(value.professions),
        professionsAt: pickTime(value.professionsAt),
        boards: pickBoards(value.boards),
        boardsAt: pickTime(value.boardsAt),
        duty: isPair(value.duty) ? value.duty : undefined,
        dutyAt: pickTime(value.dutyAt),
        progress: pickPairs(value.progress),
        progressAt: pickTime(value.progressAt),
        arena: pickPairs(value.arena),
        arenaAt: pickTime(value.arenaAt),
    }
}

// The newest section's time: a snapshot with a later one has news.
export const getSnapshotTime = (snapshot: GameSnapshot) => {
    return Math.max(
        snapshot.petsAt ?? 0,
        snapshot.itemsAt ?? 0,
        snapshot.countersAt ?? 0,
        snapshot.supplyAt ?? 0,
        snapshot.craftsAt ?? 0,
        snapshot.professionsAt ?? 0,
        snapshot.boardsAt ?? 0,
        snapshot.dutyAt ?? 0,
        snapshot.progressAt ?? 0,
        snapshot.arenaAt ?? 0,
    )
}
