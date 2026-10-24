import type { ClassAbility, ClassPreset } from "@config/classPresets"
import { keyOf } from "@planner/config/boardConfig"
import { isMainBoard, type BoardId } from "@config/boards"
import { layouts } from "@planner/config/layouts"
import type { SpecialBonusType } from "@planner/config/specialNodes"
import type { AbilityPriorities } from "@planner/storage/abilityPriorities"
import type { SpecialPriorities } from "@planner/storage/specialPriorities"

export type BoardWant =
    | { id: string; kind: "special"; bonus: SpecialBonusType; keys: string[] }
    | {
          id: string
          kind: "skill" | "passive"
          ability: ClassAbility
          keys: string[]
      }

const specialWantId = (bonus: SpecialBonusType) => `special:${bonus}`

export const boardWants = (classPreset: ClassPreset, layoutName: BoardId) => {
    const layout = layouts[layoutName]
    const assignments =
        (isMainBoard(layoutName) && classPreset.assignments[layoutName]) || {}
    const specials = new Map<SpecialBonusType, string[]>()
    const abilityKeys = new Map<string, string[]>()

    for (let row = 0; row < layout.grid.length; row += 1) {
        for (let column = 0; column < layout.grid[row].length; column += 1) {
            const kind = layout.grid[row][column]
            if (kind === "." || kind === "S") {
                continue
            }

            const key = keyOf({ row: row, column: column })
            const type = (layout.specialNodes[kind] ?? layout.mainNode).type
            const bonus = layout.specialNodeBonuses[key]
            if (type === "special" && bonus) {
                specials.set(bonus, [...(specials.get(bonus) ?? []), key])
                continue
            }

            const abilityId = assignments[key]
            if ((type === "skill" || type === "passive") && abilityId) {
                abilityKeys.set(abilityId, [
                    ...(abilityKeys.get(abilityId) ?? []),
                    key,
                ])
            }
        }
    }

    const wants: BoardWant[] = [...specials.entries()].map(([bonus, keys]) => ({
        id: specialWantId(bonus),
        kind: "special",
        bonus: bonus,
        keys: keys,
    }))
    for (const ability of classPreset.abilities) {
        const keys = abilityKeys.get(ability.id)
        if (keys) {
            wants.push({
                id: ability.id,
                kind: ability.type,
                ability: ability,
                keys: keys,
            })
        }
    }

    return wants
}

export const WANTS = ["need", "prefer", "skip"] as const

export type Want = (typeof WANTS)[number]

// Ranks 1 and 2 default to Need, rank 3 to Prefer, the rest to Skip.
const defaultWant = (rank: number): Want => {
    return rank <= 2 ? "need" : rank === 3 ? "prefer" : "skip"
}

export const wantRank = (
    want: BoardWant,
    priorities: AbilityPriorities,
    specialPriorities: SpecialPriorities,
) => {
    return want.kind === "special"
        ? specialPriorities[want.bonus]
        : (priorities[want.ability.id] ?? Number.MAX_SAFE_INTEGER)
}

export const resolveWants = ({
    wants,
    choices,
    priorities,
    specialPriorities,
}: {
    wants: readonly BoardWant[]
    choices: Readonly<Record<string, Want>>
    priorities: AbilityPriorities
    specialPriorities: SpecialPriorities
}) => {
    return new Map(
        wants.map((want) => [
            want.id,
            choices[want.id] ??
                defaultWant(wantRank(want, priorities, specialPriorities)),
        ]),
    )
}
