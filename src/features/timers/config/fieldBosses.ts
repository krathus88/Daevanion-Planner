import { everyHours, type ServerSchedule } from "@timers/logic/serverSchedule"

// Global Season 1 field bosses. NCSOFT publishes no global respawn times and
// the client has none, so these are community figures: names, zones and
// levels from aion2-guides.info; respawns are half of NCSOFT's Korean notice
// (December 2025), matching the global kill reports on aion2atlas.app (the
// same on EU, NA and Asia). Respawn is counted from the kill. The Abyss
// bosses instead keep a fixed schedule, from the global client.
const MINUTE = 60_000
const HOUR = 60 * MINUTE

// The sub-tabs of the Field bosses tab.
export type FieldBossRegion = "verteron" | "altgard" | "abyss"

export const FIELD_BOSS_REGIONS: readonly {
    id: FieldBossRegion
    // "Elyos · Verteron" where there's room, "Verteron" on phones.
    label: string
    shortLabel: string
}[] = [
    { id: "verteron", label: "Elyos · Verteron", shortLabel: "Verteron" },
    { id: "altgard", label: "Asmodians · Altgard", shortLabel: "Altgard" },
    { id: "abyss", label: "Abyss · Lower Reshanta", shortLabel: "Abyss" },
]

export const isFieldBossRegion = (value: unknown): value is FieldBossRegion => {
    return FIELD_BOSS_REGIONS.some((region) => region.id === value)
}

export type FieldBoss = {
    id: string
    region: FieldBossRegion
    name: string
    // Used where space is tight, e.g. the pinned timers in the header.
    shortName: string
    zone: string
    level?: number
    // Null for bosses on a fixed schedule rather than a kill timer.
    respawn: number | null
    // The fixed schedule, for bosses with no kill timer, and how it reads.
    schedule?: ServerSchedule
    note?: string
}

const ABYSS_ZONE = "Chaotic Lower Reshanta"
// Schedules are in EU server time, which follows Central European time
// (CET/CEST).
const EXECUTORS_SCHEDULE: ServerSchedule = {
    times: [21 * 60 + 30],
    // Mon, Thu, Sat
    days: [1, 4, 6],
    openFor: 30 * MINUTE,
}
const EXECUTORS_NOTE = "Mon, Thu, Sat 21:30"

export const FIELD_BOSSES = [
    // Verteron (Elyos)
    {
        id: "kernon",
        region: "verteron",
        name: "Kernon of the West",
        shortName: "Kernon",
        zone: "Cantas Valley",
        level: 45,
        respawn: 30 * MINUTE,
    },
    {
        id: "neikel",
        region: "verteron",
        name: "Neikel of the East",
        shortName: "Neikel",
        zone: "Cantas Valley",
        level: 45,
        respawn: 30 * MINUTE,
    },
    {
        id: "kutar",
        region: "verteron",
        name: "Rotten Kutar",
        shortName: "Kutar",
        zone: "Elun River Swamp",
        level: 45,
        respawn: 30 * MINUTE,
    },
    {
        id: "korin",
        region: "verteron",
        name: "Blooming Korin",
        shortName: "Korin",
        zone: "Elun River Midstream",
        level: 45,
        respawn: HOUR,
    },
    {
        id: "teegant",
        region: "verteron",
        name: "Bodyguard Teegant",
        shortName: "Teegant",
        zone: "Fortress Ruins",
        level: 45,
        respawn: 90 * MINUTE,
    },
    {
        id: "kusan",
        region: "verteron",
        name: "Kusan the Mad Gladiator",
        shortName: "Kusan",
        zone: "Fortress Ruins",
        level: 45,
        respawn: 2 * HOUR,
    },
    {
        id: "garshim",
        region: "verteron",
        name: "Ritualist Garshim",
        shortName: "Garshim",
        zone: "Fortress Ruins",
        level: 45,
        respawn: 2 * HOUR,
    },
    {
        id: "pnyn",
        region: "verteron",
        name: "Bloodfang Pnyn",
        shortName: "Pnyn",
        zone: "Tolbas Forest",
        level: 45,
        respawn: 3 * HOUR,
    },
    {
        id: "saursus",
        region: "verteron",
        name: "Furious Saursus",
        shortName: "Saursus",
        zone: "Tolbas Forest",
        level: 45,
        respawn: 3 * HOUR,
    },
    {
        id: "aulla",
        region: "verteron",
        name: "Scholar Aulla",
        shortName: "Aulla",
        zone: "Aulau Village",
        level: 45,
        respawn: 2 * HOUR,
    },
    {
        id: "taulo",
        region: "verteron",
        name: "Chaser Taulo",
        shortName: "Taulo",
        zone: "Aulau Village",
        level: 45,
        respawn: 2 * HOUR,
    },
    {
        id: "aullamu",
        region: "verteron",
        name: "Forest Warrior Aullamu",
        shortName: "Aullamu",
        zone: "Aulau Village",
        level: 45,
        respawn: 4 * HOUR,
    },
    {
        id: "layla",
        region: "verteron",
        name: "Heretic Layla",
        shortName: "Layla",
        zone: "Artamia Plateau",
        level: 45,
        respawn: 3 * HOUR,
    },
    {
        id: "lawa",
        region: "verteron",
        name: "Black Tentacle Lawa",
        shortName: "Lawa",
        zone: "Artamia Gorge",
        level: 45,
        respawn: 4 * HOUR,
    },
    {
        id: "demiros",
        region: "verteron",
        name: "Centurion Demiros",
        shortName: "Demiros",
        zone: "Artamia Plateau",
        level: 45,
        respawn: 4 * HOUR,
    },
    {
        id: "ansas",
        region: "verteron",
        name: "Divine Ansas",
        shortName: "Ansas",
        zone: "Artamia Plateau",
        level: 45,
        respawn: 6 * HOUR,
    },
    {
        id: "moshav",
        region: "verteron",
        name: "Harvest Manager Moshav",
        shortName: "Moshav",
        zone: "Drana Plantation",
        level: 45,
        respawn: 3 * HOUR,
    },
    {
        id: "knash",
        region: "verteron",
        name: "Sentinel K'nash",
        shortName: "K'nash",
        zone: "Drana Plantation",
        level: 45,
        respawn: 4 * HOUR,
    },
    {
        id: "setram",
        region: "verteron",
        name: "Researcher Setram",
        shortName: "Setram",
        zone: "Nahid Legion Fortress",
        level: 45,
        respawn: 6 * HOUR,
    },
    {
        id: "kasia",
        region: "verteron",
        name: "Phantasm Kasia",
        shortName: "Kasia",
        zone: "Garden of the Illusion God",
        level: 45,
        respawn: 6 * HOUR,
    },
    {
        id: "dartan",
        region: "verteron",
        name: "Silent Dartan",
        shortName: "Dartan",
        zone: "Artamia Plateau South",
        level: 48,
        respawn: 6 * HOUR,
    },
    {
        id: "kashapa",
        region: "verteron",
        name: "Soul Ruler Kashapa",
        shortName: "Kashapa",
        zone: "Artamia Plateau East",
        level: 48,
        respawn: 6 * HOUR,
    },
    {
        id: "lagta",
        region: "verteron",
        name: "High Commander Lagta",
        shortName: "Lagta",
        zone: "Red Forest",
        level: 48,
        respawn: 12 * HOUR,
    },
    {
        // "gartua" from before there were other bosses; saved timers use it.
        id: "gartua",
        region: "verteron",
        name: "Eternal Gartua",
        shortName: "Gartua",
        zone: "Isle of Eternity",
        level: 51,
        respawn: 12 * HOUR,
    },

    // Altgard (Asmodians)
    {
        id: "danar",
        region: "altgard",
        name: "Melted Danar",
        shortName: "Danar",
        zone: "Dredgion Crash Site",
        level: 45,
        respawn: 30 * MINUTE,
    },
    {
        id: "aed",
        region: "altgard",
        name: "Black Warrior Aed",
        shortName: "Aed",
        zone: "Nameless Graveyard",
        level: 45,
        respawn: 30 * MINUTE,
    },
    {
        id: "rajit",
        region: "altgard",
        name: "Faithful Rajit",
        shortName: "Rajit",
        zone: "Sanctuary Watch Post",
        level: 45,
        respawn: 30 * MINUTE,
    },
    {
        id: "vargor",
        region: "altgard",
        name: "Berserker Vargor",
        shortName: "Vargor",
        zone: "Sanctuary Watch Post",
        level: 45,
        respawn: HOUR,
    },
    {
        id: "lannar",
        region: "altgard",
        name: "Blood Warrior Lannar",
        shortName: "Lannar",
        zone: "Moslan Forest",
        level: 45,
        respawn: 90 * MINUTE,
    },
    {
        id: "garsan",
        region: "altgard",
        name: "Predator Garsan",
        shortName: "Garsan",
        zone: "Moslan Forest",
        level: 45,
        respawn: 2 * HOUR,
    },
    {
        id: "trid",
        region: "altgard",
        name: "Deceiver Trid",
        shortName: "Trid",
        zone: "Urtumheim",
        level: 45,
        respawn: 2 * HOUR,
    },
    {
        id: "kelpina",
        region: "altgard",
        name: "Blue Wave Kelpina",
        shortName: "Kelpina",
        zone: "Forest of Purification",
        level: 45,
        respawn: 2 * HOUR,
    },
    {
        id: "resana",
        region: "altgard",
        name: "Advisor Resana",
        shortName: "Resana",
        zone: "Dranactus",
        level: 45,
        respawn: 3 * HOUR,
    },
    {
        id: "nutah",
        region: "altgard",
        name: "High Overseer Nutah",
        shortName: "Nutah",
        zone: "Dranactus",
        level: 45,
        respawn: 2 * HOUR,
    },
    {
        id: "linx",
        region: "altgard",
        name: "Special Operations Leader Linx",
        shortName: "Linx",
        zone: "Basfelt Ruins",
        level: 45,
        respawn: 3 * HOUR,
    },
    {
        id: "newbold",
        region: "altgard",
        name: "Desecrator Newbold",
        shortName: "Newbold",
        zone: "Basfelt Ruins",
        level: 45,
        respawn: 4 * HOUR,
    },
    {
        id: "axios",
        region: "altgard",
        name: "Specter Archon Axios",
        shortName: "Axios",
        zone: "Basfelt Ruins",
        level: 45,
        respawn: 4 * HOUR,
    },
    {
        id: "hardirun",
        region: "altgard",
        name: "Addicted Hardirun",
        shortName: "Hardirun",
        zone: "Pafnite Burial Ground",
        level: 45,
        respawn: 3 * HOUR,
    },
    {
        id: "barthien",
        region: "altgard",
        name: "Executioner Barthien",
        shortName: "Barthien",
        zone: "Gribade Canyon West",
        level: 45,
        respawn: 4 * HOUR,
    },
    {
        id: "guruta",
        region: "altgard",
        name: "Drakan Battalion Weapon Guruta",
        shortName: "Guruta",
        zone: "Gribade Canyon East",
        level: 45,
        respawn: 6 * HOUR,
    },
    {
        id: "shujakan",
        region: "altgard",
        name: "Veteran Shujakan",
        shortName: "Shujakan",
        zone: "Black Claw Village",
        level: 45,
        respawn: 3 * HOUR,
    },
    {
        id: "karuka",
        region: "altgard",
        name: "Visionary Karuka",
        shortName: "Karuka",
        zone: "Black Claw Village",
        level: 45,
        respawn: 4 * HOUR,
    },
    {
        id: "vishwada",
        region: "altgard",
        name: "Dark Shadow Vishwada",
        shortName: "Vishwada",
        zone: "Ragta Fortress",
        level: 45,
        respawn: 6 * HOUR,
    },
    {
        id: "shylak",
        region: "altgard",
        name: "Sharp Shylak",
        shortName: "Shylak",
        zone: "Impetusium Plaza",
        level: 45,
        respawn: 6 * HOUR,
    },
    {
        id: "dartan-altgard",
        region: "altgard",
        name: "Silent Dartan",
        shortName: "Dartan",
        zone: "Forest of Purification",
        level: 48,
        respawn: 6 * HOUR,
    },
    {
        id: "kashapa-altgard",
        region: "altgard",
        name: "Soul Ruler Kashapa",
        shortName: "Kashapa",
        zone: "Pafnite Burial Ground",
        level: 48,
        respawn: 6 * HOUR,
    },
    {
        id: "lagta-altgard",
        region: "altgard",
        name: "High Commander Lagta",
        shortName: "Lagta",
        zone: "Ragta Fortress",
        level: 48,
        respawn: 12 * HOUR,
    },
    {
        id: "immortal-gartua",
        region: "altgard",
        name: "Immortal Gartua",
        shortName: "Gartua",
        zone: "Isle of Immortality",
        level: 51,
        respawn: 12 * HOUR,
    },

    // Chaotic Lower Reshanta (Abyss): fixed schedules, not kill timers.
    {
        id: "watcher-kaira",
        region: "abyss",
        name: "Watcher Kaira",
        shortName: "Kaira",
        zone: ABYSS_ZONE,
        level: 65,
        respawn: null,
        // Up for about 30 minutes.
        schedule: { times: everyHours(3, 1), openFor: 30 * MINUTE },
        note: "Every 3 h from 01:00",
    },
    {
        id: "argo",
        region: "abyss",
        name: "Executor Argo",
        shortName: "Argo",
        zone: ABYSS_ZONE,
        level: 65,
        respawn: null,
        schedule: EXECUTORS_SCHEDULE,
        note: EXECUTORS_NOTE,
    },
    {
        id: "executor-kaira",
        region: "abyss",
        name: "Executor Kaira",
        shortName: "Kaira",
        zone: ABYSS_ZONE,
        level: 65,
        respawn: null,
        schedule: EXECUTORS_SCHEDULE,
        note: EXECUTORS_NOTE,
    },
    {
        id: "tamasa",
        region: "abyss",
        name: "Executor Tamasa",
        shortName: "Tamasa",
        zone: ABYSS_ZONE,
        level: 65,
        respawn: null,
        schedule: EXECUTORS_SCHEDULE,
        note: EXECUTORS_NOTE,
    },
    {
        // "siege-boss" from before it had a name; saved timers use it.
        id: "siege-boss",
        region: "abyss",
        name: "Guardian Lord Nahma",
        shortName: "Nahma",
        zone: ABYSS_ZONE,
        level: 65,
        respawn: null,
        schedule: {
            times: [21 * 60],
            // Sun, Fri
            days: [0, 5],
            openFor: 30 * MINUTE,
        },
        note: "Fri, Sun 21:00",
    },
] as const satisfies readonly FieldBoss[]

export type FieldBossId = (typeof FIELD_BOSSES)[number]["id"]
