import { PANTHEON_STATS } from "@config/stats/pantheonStats"
import type {
    ArtworkStat,
    ChestReward,
    LootDrop,
    LootPiece,
} from "@timers/config/fieldBossLoot"

// A line in a loot tooltip: a label, an optional detail beside it and a
// value at the end. An "effect" value says what a stat does in game.
export type LootDetailRow = {
    label: string
    value: string
    detail?: string
    valueTone?: "muted" | "effect"
    // Lines nested under this one, e.g. a chest set's pieces.
    children?: readonly LootDetailRow[]
}

// Who gets a drop and how likely, e.g. "25% per kill, top-damage party
// only".
export const getLootChanceLabel = (drop: LootDrop) => {
    if (drop.everyone) {
        return `${drop.chance}% per kill, for every player with contribution`
    }

    return drop.chance >= 100
        ? "guaranteed for the top-damage party"
        : `${drop.chance}% per kill, top-damage party only`
}

// Bound drops carry "(Bound)" in their game name: the loot chest, along
// with everything it holds, and souls. The rest is unbound.
export const isBoundLoot = (drop: LootDrop) => {
    return drop.name.endsWith("(Bound)")
}

// E.g. "Bound, as is everything inside" for a chest.
export const getBindingLabel = (drop: LootDrop) => {
    if (!isBoundLoot(drop)) {
        return "Unbound, tradeable"
    }

    return drop.contents
        ? "Bound, as is everything inside"
        : "Bound, can't be traded"
}

const formatPercent = (value: number) => {
    return `${value > 0 ? "+" : ""}${Number(value.toFixed(2))}%`
}

// The item level every piece shares, or null if they differ.
const getSharedItemLevel = (pieces: readonly LootPiece[]) => {
    const level = pieces[0]?.itemLevel

    for (const piece of pieces) {
        if (piece.itemLevel !== level) {
            return null
        }
    }

    return level ?? null
}

// E.g. "One of 7 · ilvl 70:" when every piece shares its item level.
export const getSetTitle = (pieces: readonly LootPiece[]) => {
    const shared = getSharedItemLevel(pieces)

    return shared === null
        ? `One of ${pieces.length}:`
        : `One of ${pieces.length} · ilvl ${shared}:`
}

export const getPieceRows = (pieces: readonly LootPiece[]) => {
    const shared = getSharedItemLevel(pieces)
    const rows: LootDetailRow[] = []

    for (const piece of pieces) {
        rows.push({
            label: piece.name,
            value: `${piece.chance}%`,
            detail: shared === null ? `ilvl ${piece.itemLevel}` : undefined,
        })
    }

    return rows
}

export const getChestRows = (contents: readonly ChestReward[]) => {
    const rows: LootDetailRow[] = []

    for (const reward of contents) {
        const shared = reward.pieces ? getSharedItemLevel(reward.pieces) : null
        let detail: string | undefined

        if (reward.amount) {
            detail = `×${reward.amount}`
        } else if (reward.pieces) {
            detail = `1 of ${reward.pieces.length}`

            if (shared !== null) {
                detail += ` · ilvl ${shared}`
            }
        }

        rows.push({
            label: reward.name,
            value: `${reward.chance}%`,
            detail: detail,
            children: reward.pieces ? getPieceRows(reward.pieces) : undefined,
        })
    }

    return rows
}

export const getStatRows = (stats: readonly ArtworkStat[]) => {
    const rows: LootDetailRow[] = []

    for (const stat of stats) {
        const effects = PANTHEON_STATS[stat.name] ?? []
        const parts: string[] = []

        for (const effect of effects) {
            parts.push(
                `${formatPercent(effect.perPoint * stat.value)} ${effect.name}`,
            )
        }

        rows.push({
            label: stat.name.replace(/ \[.*\]$/, ""),
            value: parts.join(", "),
            detail: `+${stat.value}`,
            valueTone: "effect",
        })
    }

    return rows
}
