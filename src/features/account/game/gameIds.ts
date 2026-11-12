import type { BoardId } from "@config/boards"
import type { ClassId } from "@config/classPresets/classInfo"
import type { ProfessionId } from "@crafting/config/professions"
import { SERVERS } from "@timers/config/servers"

// The game's numbers for things, read from real captures (client revision
// 3535, Nov 2026). A patch can change them; unknown ones are left alone.

// Class numbers seen on real characters. The rest of the pattern (Assassin
// 14, Ranger 18, Sorcerer 22, Spirit Master 26) is a guess, so it isn't used:
// characters of those classes are matched by name but not created.
export const GAME_CLASSES: Record<number, ClassId> = {
    6: "gladiator",
    10: "templar",
    30: "cleric",
    34: "chanter",
}

// Server numbers follow the pair order: 1301-1323 Elyos, 2301-2323
// Asmodians (the same numbering NotMeter uses).
export const getServerId = (number: number) => {
    let index = 0

    for (const server of SERVERS) {
        const base = server.faction === "elyos" ? 1301 : 2301

        if (base + Math.floor(index / 2) === number) {
            return server.id
        }

        index++
    }

    return null
}

// Odyle Energy: [recharged, extra].
// Crafting professions as the game numbers them (its crafting window's
// order, checked 2026-11-12). Levels count on across ranks, like the site's.
export const GAME_PROFESSIONS: Record<string, ProfessionId> = {
    "1": "blacksmithing",
    "2": "armorsmithing",
    "3": "handicrafting",
    "4": "alchemy",
    "5": "cooking",
}

// Daevanion boards as the game numbers them; 6 is Azphel (PvP), which the
// planner leaves out.
export const GAME_BOARDS: Record<string, BoardId> = {
    "1": "nezekan",
    "2": "zikel",
    "3": "vaizel",
    "4": "triniel",
    "5": "ariel",
}

export const ENERGY_COUNTER = "60000001"

// Tracker tasks the game counts: task id → counter id ([entries, bonus]).
export const TASK_COUNTERS: Record<string, string> = {
    "shugo-festival": "1",
    nightmare: "4",
    invasion: "8",
    "unknown-fissure": "101",
    "ascension-trial": "80000001",
}

// Tracker tasks a weekly crafting limit counts: task id → the recipe and
// which of its counts (server-wide or the character's own).
export const CRAFT_TASKS: Record<
    string,
    { recipe: string; limit: "server" | "character" }
> = {
    "odyle-craft-server": { recipe: "31070001", limit: "server" },
    "odyle-craft": { recipe: "31070002", limit: "character" },
}

// The Hidden Cube key item, kept per character.
export const HIDDEN_CUBE_KEY = "630900003"

// The supply request tab the daily task tracks.
export const EMERGENCY_SUPPLY = 1

// Arena tasks: task id → the game's arena mode (1 Arena 1v1, 2 Arena 5v5;
// checked 2026-11-12) and what they count. The game sends lifetime records per
// mode (arenaWeeks works out the week's).
export const ARENA_TASKS: Record<
    string,
    { mode: string; counts: "played" | "won" }
> = {
    "arena-participation": { mode: "2", counts: "played" },
    "arena-wins": { mode: "2", counts: "won" },
    "arena-1v1-participation": { mode: "1", counts: "played" },
    "arena-1v1-wins": { mode: "1", counts: "won" },
}

// Progress counters with this week's arena matches and wins, all modes
// together.
export const ARENA_PLAYED = "231210800"
export const ARENA_WON = "231210900"

// The tracker task the daily duty board counts.
export const DUTY_TASK = "duty-missions"

// The tracker task a delivered Emergency card completes.
export const SUPPLY_TASK = "supply-requests"

// Storage codes in a snapshot's items: the character's bag, Server Storage
// (the same on every character) and Character Storage (its own bank).
export const BAG_STORAGE = "1"
export const SHARED_STORAGE = "2"
export const CHARACTER_STORAGE = "15"
