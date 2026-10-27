import type { RealtimeChannel } from "@supabase/supabase-js"
import type { BossReport } from "@timers/storage/timerSettings"
import { supabase } from "@account/supabaseClient"

type ReportRow = {
    server: string
    boss_id: string
    spawn_at: string | null
    killed_at: string | null
    reported_at: string
}

export type SharedReport = {
    report: BossReport
    reportedAt: number
}

export type SharedReports = Partial<Record<string, SharedReport>>

const TABLE = "boss_reports"
const COLUMNS = "server, boss_id, spawn_at, killed_at, reported_at"

// `scope` is a server id, or a pair id for the Abyss.
export const getSharedReportKey = (scope: string, bossId: string) => {
    return `${scope}/${bossId}`
}

const toSharedReport = (row: ReportRow): SharedReport => {
    const reportedAt = Date.parse(row.reported_at)

    return {
        report: row.spawn_at
            ? { spawnAt: Date.parse(row.spawn_at), reportedAt: reportedAt }
            : { killedAt: Date.parse(row.killed_at ?? row.reported_at) },
        reportedAt: reportedAt,
    }
}

let reports: SharedReports = {}
let watching: { scopes: string[]; channel: RealtimeChannel } | null = null
const listeners = new Set<() => void>()

const emit = () => {
    for (const listener of listeners) {
        listener()
    }
}

const putRow = (row: ReportRow) => {
    reports = {
        ...reports,
        [getSharedReportKey(row.server, row.boss_id)]: toSharedReport(row),
    }
    emit()
}

const removeRow = (scope: string, bossId: string) => {
    const next = { ...reports }

    delete next[getSharedReportKey(scope, bossId)]
    reports = next
    emit()
}

const isWatched = (scope: unknown) => {
    return (
        typeof scope === "string" &&
        watching !== null &&
        watching.scopes.includes(scope)
    )
}

const load = async (scopes: string[]) => {
    const { data, error } = await supabase
        .from(TABLE)
        .select(COLUMNS)
        .in("server", scopes)

    if (error || watching?.scopes !== scopes) {
        return
    }

    const loaded: SharedReports = {}

    for (const row of data) {
        loaded[getSharedReportKey(row.server, row.boss_id)] =
            toSharedReport(row)
    }

    reports = loaded
    emit()
}

const stop = () => {
    if (watching) {
        void supabase.removeChannel(watching.channel)
        watching = null
    }
}

const watch = (scopes: string[]) => {
    if (watching?.scopes.join() === scopes.join()) {
        return
    }

    stop()
    reports = {}

    // Unfiltered: Supabase can't filter deletes, and the table is tiny.
    const channel = supabase
        .channel(`${TABLE}:${scopes.join()}`)
        .on(
            "postgres_changes",
            { event: "*", schema: "public", table: TABLE },
            (payload) => {
                if (payload.eventType === "DELETE") {
                    if (isWatched(payload.old.server)) {
                        removeRow(payload.old.server, payload.old.boss_id)
                    }
                } else if (isWatched(payload.new.server)) {
                    putRow(payload.new as ReportRow)
                }
            },
        )
        .subscribe((status) => {
            // Also on reconnects, to catch up on anything missed.
            if (status === "SUBSCRIBED") {
                void load(scopes)
            }
        })

    watching = { scopes: scopes, channel: channel }
}

export const readSharedReports = () => {
    return reports
}

export const subscribeToSharedReports = (
    scopes: string[],
    onChange: () => void,
) => {
    watch(scopes)
    listeners.add(onChange)

    return () => {
        listeners.delete(onChange)

        if (listeners.size === 0) {
            stop()
            reports = {}
        }
    }
}

// Resolves false when the database refuses it, e.g. not on the allowlist.
export const writeSharedReport = async (
    scope: string,
    bossId: string,
    report: BossReport | null,
) => {
    if (!report) {
        const { error } = await supabase
            .from(TABLE)
            .delete()
            .eq("server", scope)
            .eq("boss_id", bossId)

        if (!error && isWatched(scope)) {
            removeRow(scope, bossId)
        }

        return !error
    }

    const { data, error } = await supabase
        .from(TABLE)
        .upsert({
            server: scope,
            boss_id: bossId,
            spawn_at:
                "spawnAt" in report
                    ? new Date(report.spawnAt).toISOString()
                    : null,
            killed_at:
                "killedAt" in report
                    ? new Date(report.killedAt).toISOString()
                    : null,
        })
        .select(COLUMNS)
        .single()

    if (!error && isWatched(scope)) {
        putRow(data)
    }

    return !error
}
