import {
    Arena,
    AscensionTrial,
    Battlefield,
    CommandAbyss,
    CommandFaction,
    DailyDungeon,
    DutyMissions,
    Ludra,
    Nightmare,
    OdyleEnergy,
    ShugoFestival,
    SupplyRequest,
} from "@assets/tracker"

// By starter task id, so a renamed starter task keeps its icon and the
// user's own tasks have none.
const TASK_ICONS: Record<string, string> = {
    "supply-requests": SupplyRequest,
    nightmare: Nightmare,
    "duty-missions": DutyMissions,
    "shugo-festival": ShugoFestival,
    "unknown-fissure": DailyDungeon,
    "ascension-trial": AscensionTrial,
    "arena-wins": Arena,
    "arena-participation": Arena,
    "battlefield-wins": Battlefield,
    "battlefield-participation": Battlefield,
    ludra: Ludra,
    "odyle-craft": OdyleEnergy,
    "odyle-shop": OdyleEnergy,
    "odyle-craft-server": OdyleEnergy,
    "odyle-shop-server": OdyleEnergy,
    "command-faction": CommandFaction,
    "command-abyss": CommandAbyss,
}

export const getTaskIcon = (taskId: string) => {
    return TASK_ICONS[taskId]
}
