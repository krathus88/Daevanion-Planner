import type { FieldBossRegion } from "./fieldBosses"

// EU pairs from aion-2.online (checked against NCSOFT's notices, Oct 2026):
// each Elyos server shares the Abyss with its Asmodian partner.
const SERVER_PAIRS = [
    ["Siel", "Israphel"],
    ["Nezekan", "Zikel"],
    ["Vaizel", "Triniel"],
    ["Kaisinel", "Lumiel"],
    ["Yustiel", "Marchutan"],
    ["Ariel", "Azphel"],
    ["Fregion", "Ereshkigal"],
    ["Meslamtaeda", "Beritra"],
    ["Hithanya", "Nemon"],
    ["Nania", "Hadala"],
    ["Tahavatha", "Ludra"],
    ["Luteros", "Ulgorn"],
    ["Phernos", "Munin"],
    ["Daminu", "Odar"],
    ["Kasaka", "Zemurru"],
    ["Bakarma", "Kromede"],
    ["Tsenka", "Quai"],
    ["Kochi", "Baba"],
    ["Ishtar", "Fafnir"],
    ["Tiamat", "Indrath"],
    ["Gauss", "Agnita"],
    ["Lamuatan", "Atiel"],
    ["Nathara", "Tassin"],
] as const

export type ServerFaction = "elyos" | "asmodians"

export type Server = {
    id: string
    name: string
    faction: ServerFaction
    // Shared by both servers of a pair, e.g. "siel-israphel".
    pairId: string
}

const toId = (name: string) => {
    return name.toLowerCase()
}

const toServers = () => {
    const servers: Server[] = []

    for (const [elyos, asmodian] of SERVER_PAIRS) {
        const pairId = `${toId(elyos)}-${toId(asmodian)}`

        servers.push({
            id: toId(elyos),
            name: elyos,
            faction: "elyos",
            pairId: pairId,
        })
        servers.push({
            id: toId(asmodian),
            name: asmodian,
            faction: "asmodians",
            pairId: pairId,
        })
    }

    return servers
}

export const SERVERS: readonly Server[] = toServers()

export const SERVER_FACTIONS: readonly {
    id: ServerFaction
    label: string
}[] = [
    { id: "elyos", label: "Elyos" },
    { id: "asmodians", label: "Asmodians" },
]

export const DEFAULT_SERVER_ID = "siel"

export const isServerId = (value: unknown): value is string => {
    return SERVERS.some((server) => server.id === value)
}

export const getServer = (id: string) => {
    return (
        SERVERS.find((server) => server.id === id) ??
        SERVERS.find((server) => server.id === DEFAULT_SERVER_ID)!
    )
}

// The other faction's server it shares the Abyss with.
export const getPartner = (server: Server) => {
    return SERVERS.find(
        (other) => other.pairId === server.pairId && other.id !== server.id,
    )!
}

const FACTION_REGIONS: Record<ServerFaction, FieldBossRegion> = {
    elyos: "verteron",
    asmodians: "altgard",
}

export const getFactionRegion = (server: Server) => {
    return FACTION_REGIONS[server.faction]
}

// The server's own field bosses, then the Abyss it shares with its pair.
export const getServerRegions = (server: Server): FieldBossRegion[] => {
    return [getFactionRegion(server), "abyss"]
}

// Where a boss's shared report is kept: per server, or per pair in the Abyss.
export const getReportScope = (server: Server, region: FieldBossRegion) => {
    return region === "abyss" ? server.pairId : server.id
}
