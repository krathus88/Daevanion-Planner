import { isRecord } from "@planner/storage/isRecord"
import { FIELD_BOSSES } from "@timers/config/fieldBosses"
import { NOTMETER_BOSS_CODES } from "@timers/config/notmeterBosses"
import { SERVERS } from "@timers/config/servers"
import { getSharedReportKey, type SharedReports } from "./sharedReports"

// NotMeter's live EU field boss times: a public file on GitHub (CORS open),
// rewritten every few minutes. Credited on the Timers page.
export const NOTMETER_FEED_URL =
    "https://raw.githubusercontent.com/Not4You-Dev/NotMeter-Cache/main/presence/notmeter-field-boss-public-ww-eu-expanded.json"

const SCHEMA = "notmeter-global-field-boss-public-cache-v1"
const REFRESH_MS = 2 * 60_000

export type NotmeterFeedResult =
    { ok: true; reports: SharedReports } | { ok: false; error: string }

export type NotmeterFeed = {
    // Keyed like shared reports: `<server id>/<boss id>`.
    reports: SharedReports
    // Why the last read failed; the last good reports stay meanwhile.
    error: string | null
}

const fail = (error: string): NotmeterFeedResult => {
    return { ok: false, error: error }
}

const isTime = (value: unknown): value is number => {
    return typeof value === "number" && Number.isFinite(value) && value > 0
}

// NotMeter numbers EU servers 1301-1323 (Elyos) and 2301-2323 (Asmodians),
// in the same pair order as ours.
const toServerIds = () => {
    const ids = new Map<number, string>()

    for (const [index, server] of SERVERS.entries()) {
        const base = server.faction === "elyos" ? 1301 : 2301

        ids.set(base + Math.floor(index / 2), server.id)
    }

    return ids
}

const SERVER_IDS = toServerIds()

const RESPAWNS = new Map<string, number>(
    FIELD_BOSSES.map((boss) => [boss.id, boss.respawn ?? 0]),
)

// Strict on purpose: a changed format reads as an error, never as no data.
export const parseNotmeterFeed = (value: unknown): NotmeterFeedResult => {
    if (!isRecord(value)) {
        return fail("not a JSON object")
    }

    if (value.schema !== SCHEMA || value.version !== 1) {
        return fail(
            `unknown format ${String(value.schema)} v${String(value.version)}`,
        )
    }

    if (value.globalRegion !== "eu") {
        return fail(`not the EU feed (${String(value.globalRegion)})`)
    }

    if (!Array.isArray(value.servers)) {
        return fail("no server list")
    }

    const reports: SharedReports = {}
    let matched = 0

    for (const server of value.servers) {
        if (!isRecord(server) || !Array.isArray(server.maps)) {
            return fail("a server has no map list")
        }

        const serverId =
            typeof server.serverId === "number"
                ? SERVER_IDS.get(server.serverId)
                : undefined

        for (const map of server.maps) {
            if (!isRecord(map) || !Array.isArray(map.entries)) {
                return fail("a map has no boss list")
            }

            for (const entry of map.entries) {
                if (
                    !isRecord(entry) ||
                    typeof entry.bossCode !== "number" ||
                    !isTime(entry.targetAt) ||
                    !isTime(entry.observedAtMs)
                ) {
                    return fail("a boss entry is malformed")
                }

                const bossId = NOTMETER_BOSS_CODES[entry.bossCode]

                if (!serverId || !bossId) {
                    continue
                }

                matched++

                // Up when seen: its spawn time is unknown, so other
                // sources stand until NotMeter sees the next spawn.
                if (entry.spawned === true) {
                    continue
                }

                // Dated by the kill it counts from (NotMeter learns kills
                // from its meter), not by when it was read: it re-reads every
                // few minutes, so that would always beat a manual report.
                reports[getSharedReportKey(serverId, bossId)] = {
                    report: {
                        spawnAt: entry.targetAt,
                        reportedAt: entry.observedAtMs,
                    },
                    reportedAt: entry.targetAt - (RESPAWNS.get(bossId) ?? 0),
                }
            }
        }
    }

    if (matched === 0) {
        return fail("none of its servers or bosses match ours")
    }

    return { ok: true, reports: reports }
}

export const fetchNotmeterFeed = async (): Promise<NotmeterFeedResult> => {
    try {
        // A new URL each minute gets past GitHub's cache.
        const response = await fetch(
            `${NOTMETER_FEED_URL}?v=${Math.floor(Date.now() / 60_000)}`,
            { cache: "no-cache" },
        )

        if (!response.ok) {
            return fail(`HTTP ${response.status}`)
        }

        return parseNotmeterFeed(await response.json())
    } catch (error) {
        return fail(error instanceof Error ? error.message : String(error))
    }
}

let feed: NotmeterFeed = { reports: {}, error: null }
let timer: ReturnType<typeof setInterval> | null = null
const listeners = new Set<() => void>()

const emit = () => {
    for (const listener of listeners) {
        listener()
    }
}

const refresh = async () => {
    if (document.hidden) {
        return
    }

    const result = await fetchNotmeterFeed()

    if (listeners.size === 0) {
        return
    }

    if (result.ok) {
        feed = { reports: result.reports, error: null }
    } else {
        console.error(`NotMeter feed: ${result.error}`)
        feed = { reports: feed.reports, error: result.error }
    }

    emit()
}

const handleVisibilityChange = () => {
    void refresh()
}

export const readNotmeterFeed = () => {
    return feed
}

export const subscribeToNotmeterFeed = (onChange: () => void) => {
    listeners.add(onChange)

    if (!timer) {
        timer = setInterval(handleVisibilityChange, REFRESH_MS)
        document.addEventListener("visibilitychange", handleVisibilityChange)
        void refresh()
    }

    return () => {
        listeners.delete(onChange)

        if (listeners.size === 0 && timer) {
            clearInterval(timer)
            timer = null
            document.removeEventListener(
                "visibilitychange",
                handleVisibilityChange,
            )
            feed = { reports: {}, error: null }
        }
    }
}
