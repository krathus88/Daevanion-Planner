import { entriesOf, itemsOf, parseOrNull, wholeNumber } from "@common/schemas"
import * as v from "valibot"

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
    // Item level and power score, as the character window shows them; only
    // shown (readGameGear), never applied.
    itemLevel?: number
    power?: number
    gearAt?: number
    // Progress counters changed in the 8 days before progressAt: id →
    // [count, last change (ms)]. One missing wasn't counted lately.
    progress?: Record<string, [number, number]>
    progressAt?: number
    // Arena mode (gameIds ARENA_TASKS) → lifetime [wins, losses].
    arena?: Record<string, [number, number]>
    arenaAt?: number
    // Abyss corridor entrances the character may still use (counter ids, see
    // gameIds CORRIDORS), as known at corridorsAt (only once the character
    // entered the Abyss: login sends none): missing with corridorsAt set
    // means none.
    corridors?: string[]
    corridorsAt?: number
    // Artifact id → faction holding it (0 none, 1 Elyos, 2 Asmodians), and
    // when the last Artifact Siege ended (ms).
    artifacts?: Record<string, number>
    siegeEnd?: number
    artifactsAt?: number
    // Shop id → entry → how many the character bought ever, for shops with
    // lifetime limits (gameIds SHOP_TASKS), sent when a shop opens. Entries
    // never bought are left out.
    shops?: Record<string, Record<string, number>>
    shopsAt?: number
    // Weekly purchase counts (gameIds LIMIT_TASKS): purchase limit id or
    // weekly shop entry id → [count, read at (ms)], counted in the week of
    // that time; sent when a shop opens. A weekly shop lists only entries
    // bought this week, so an entry read in an earlier week than the
    // shop's newest is at 0. A server-wide limit's count is the server's.
    limits?: Record<string, [number, number]>
    limitsAt?: number
}

const count = wholeNumber(0)

const pair = v.strictTuple([count, count])

const triple = v.strictTuple([count, count, count])

// A board's cells, numbered 1-225.
const cell = wholeNumber(1, 225)

const SupplySchema = v.object({
    kind: count,
    start: count,
    end: count,
    cards: count,
    delivered: count,
})

// A section the game sent: one that doesn't parse is left out on its own.
const section = <S extends v.GenericSchema<unknown>>(schema: S) => {
    return v.fallback(v.optional(schema), undefined)
}

// Storage code (or shop id) → item id (or entry) → count.
const counts = entriesOf(entriesOf(count))

const time = section(v.pipe(count, v.minValue(1)))

const SectionsSchema = v.object({
    character: v.object({
        name: v.pipe(v.string(), v.minLength(1)),
        server: count,
        class: count,
    }),
    pets: section(entriesOf(pair)),
    petsAt: time,
    items: section(counts),
    bound: section(counts),
    itemsAt: time,
    counters: section(entriesOf(pair)),
    countersAt: time,
    supply: section(itemsOf(SupplySchema)),
    supplyAt: time,
    crafts: section(entriesOf(triple)),
    craftsAt: time,
    professions: section(entriesOf(wholeNumber(1))),
    professionsAt: time,
    boards: section(entriesOf(itemsOf(cell))),
    boardsAt: time,
    duty: section(pair),
    dutyAt: time,
    itemLevel: section(count),
    power: section(count),
    gearAt: time,
    progress: section(entriesOf(pair)),
    progressAt: time,
    arena: section(entriesOf(pair)),
    arenaAt: time,
    corridors: section(itemsOf(v.string())),
    corridorsAt: time,
    artifacts: section(entriesOf(count)),
    siegeEnd: time,
    artifactsAt: time,
    shops: section(counts),
    shopsAt: time,
    limits: section(entriesOf(pair)),
    limitsAt: time,
})

// The version only decides whether the site understands it.
const VersionSchema = v.looseObject({ v: v.literal(1) })

// Null when it isn't a snapshot this version of the site understands.
export const parseGameSnapshot = (value: unknown): GameSnapshot | null => {
    return v.is(VersionSchema, value)
        ? parseOrNull(SectionsSchema, value)
        : null
}

// The newest applied section's time: a snapshot with a later one has news.
// Gear isn't applied, only shown.
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
        snapshot.corridorsAt ?? 0,
        snapshot.artifactsAt ?? 0,
        snapshot.shopsAt ?? 0,
        snapshot.limitsAt ?? 0,
    )
}
