import {
    DEFAULT_STAT_TIERS,
    STAT_TIERS,
    STAT_TYPES,
    type StatTier,
    type StatType,
} from "@planner/config/stats"
import { isRecord } from "./isRecord"

export type StatSettings = {
    tiers: Record<StatType, StatTier>
    // Spend points left after special nodes, Min and ranks on stat nodes.
    spendLeftover: boolean
}

export const DEFAULT_STAT_SETTINGS: StatSettings = {
    tiers: DEFAULT_STAT_TIERS,
    spendLeftover: false,
}

const keyFor = (classId: string) => {
    return `daevanion:stat-priorities:v1:${classId}`
}

const isTier = (value: unknown): value is StatTier => {
    return (
        typeof value === "string" &&
        (STAT_TIERS as readonly string[]).includes(value)
    )
}

export const readStatSettings = (classId: string): StatSettings => {
    try {
        const raw = window.localStorage.getItem(keyFor(classId))
        if (raw === null) {
            return DEFAULT_STAT_SETTINGS
        }

        const value: unknown = JSON.parse(raw)
        if (!isRecord(value)) {
            throw new Error("Saved stat priorities are invalid.")
        }
        const tiers = isRecord(value.tiers) ? value.tiers : {}

        return {
            tiers: Object.fromEntries(
                STAT_TYPES.map((stat) => [
                    stat,
                    isTier(tiers[stat])
                        ? tiers[stat]
                        : DEFAULT_STAT_TIERS[stat],
                ]),
            ) as Record<StatType, StatTier>,
            spendLeftover: value.spendLeftover === true,
        }
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? `Could not read stat priorities: ${error.message}`
                : "Could not read stat priorities.",
            { cause: error },
        )
    }
}

export const writeStatSettings = (classId: string, settings: StatSettings) => {
    try {
        window.localStorage.setItem(keyFor(classId), JSON.stringify(settings))
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save stat priorities: ${error.message}`
            : "Could not save stat priorities."
    }
}
