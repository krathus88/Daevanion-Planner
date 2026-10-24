import { readClassSettings, writeClassSettings } from "./classSettings"
import { isRecord } from "./isRecord"

export const RANK_GROUPS = ["skill", "passive", "special"] as const
export type RankGroup = (typeof RANK_GROUPS)[number]

// Groups on the same level compete, cheapest path first.
export const SAME_RANK_ORDERS = ["more", "equal", "less"] as const
export type SameRankOrder = (typeof SAME_RANK_ORDERS)[number]

export type RankOrder = Readonly<Record<RankGroup, SameRankOrder>>

export const RANK_GROUP_NAMES: Record<RankGroup, string> = {
    skill: "Skills",
    passive: "Passives",
    special: "Special nodes",
}

export const SAME_RANK_ORDER_NAMES: Record<SameRankOrder, string> = {
    more: "More",
    equal: "Equal",
    less: "Less",
}

export const DEFAULT_RANK_ORDER: RankOrder = {
    skill: "equal",
    passive: "less",
    special: "equal",
}

const isOrder = (value: unknown): value is SameRankOrder => {
    return (
        typeof value === "string" &&
        (SAME_RANK_ORDERS as readonly string[]).includes(value)
    )
}

export const readRankOrder = (
    classId: string,
    source?: Record<string, unknown>,
): RankOrder => {
    try {
        const value = readClassSettings(classId, "rankOrder", source)
        if (value === undefined) {
            return DEFAULT_RANK_ORDER
        }

        if (!isRecord(value)) {
            throw new Error("Saved same-rank order is invalid.")
        }

        return Object.fromEntries(
            RANK_GROUPS.map((group) => [
                group,
                isOrder(value[group])
                    ? value[group]
                    : DEFAULT_RANK_ORDER[group],
            ]),
        ) as RankOrder
    } catch (error) {
        throw new Error(
            error instanceof Error
                ? `Could not read same-rank order: ${error.message}`
                : "Could not read same-rank order.",
            { cause: error },
        )
    }
}

export const writeRankOrder = (classId: string, order: RankOrder) => {
    try {
        writeClassSettings(classId, "rankOrder", order)
        return null
    } catch (error) {
        return error instanceof Error
            ? `Could not save same-rank order: ${error.message}`
            : "Could not save same-rank order."
    }
}
