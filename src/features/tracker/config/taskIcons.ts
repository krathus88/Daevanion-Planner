import {
    ArtifactSiege,
    DimensionalInvasion,
    ShugoFestival,
} from "@assets/timers"
import {
    Arena1v1,
    Arena5v5,
    AscensionTrial,
    Battlefield,
    CommandAbyss,
    CommandFaction,
    DaevanionCrystal,
    DailyDungeon,
    DutyMissions,
    Ludra,
    Nightmare,
    OdyleEnergy,
    StigmaShard,
    SupplyRequest,
} from "@assets/tracker"

// By starter task id, so a renamed starter task keeps its icon and the
// user's own tasks have none.
const TASK_ICONS: Record<string, string> = {
    "supply-requests": SupplyRequest,
    nightmare: Nightmare,
    "duty-missions": DutyMissions,
    // The Timers page's Shugo Festival icon.
    "shugo-festival": ShugoFestival,
    // The Timers page's Dimensional Invasion icon.
    invasion: DimensionalInvasion,
    "unknown-fissure": DailyDungeon,
    "ascension-trial": AscensionTrial,
    // Same crossed swords, told apart by color: 5v5 blue, 1v1 red,
    // Battlefield grey.
    "arena-wins": Arena5v5,
    "arena-participation": Arena5v5,
    "arena-1v1-wins": Arena1v1,
    "arena-1v1-participation": Arena1v1,
    "battlefield-wins": Battlefield,
    "battlefield-participation": Battlefield,
    ludra: Ludra,
    "odyle-craft": OdyleEnergy,
    "odyle-shop": OdyleEnergy,
    "odyle-craft-server": OdyleEnergy,
    "odyle-shop-server": OdyleEnergy,
    "command-faction": CommandFaction,
    "command-abyss": CommandAbyss,
    // The Timers page's Artifact Siege icon.
    corridors: ArtifactSiege,
    "crystals-nightmare": DaevanionCrystal,
    "crystals-shugo": DaevanionCrystal,
    "shards-nightmare": StigmaShard,
    "shards-shugo": StigmaShard,
    "shards-abyss": StigmaShard,
}

export const getTaskIcon = (taskId: string) => {
    return TASK_ICONS[taskId]
}

// Ticket icons that look alike get a glow to tell them apart at a glance:
// Nightmare blue, Ascension Trial red.
const TASK_ICON_GLOWS: Record<string, string> = {
    nightmare: "blue.400",
    "ascension-trial": "red.500",
}

export const getTaskIconGlow = (taskId: string) => {
    return TASK_ICON_GLOWS[taskId]
}
