import type { BoardId } from "@config/boards"

type ClassAbilityType = "skill" | "passive"

export type ClassAbility = {
    id: string
    name: string
    type: ClassAbilityType
    priority?: number
    icon?: string
    // Shown under the name and cost in the node's tooltip.
    tooltip?: string
    // Seconds; left out when there is none.
    cooldown?: number
    // Specializations unlocked as the skill levels up, listed in the tooltip.
    // Levels are per unlock since they differ between skills and stigmas.
    unlocks?: readonly AbilityUnlock[]
}

type AbilityUnlock = {
    level: number
    effect: string
}

export type ClassPreset<
    Abilities extends readonly ClassAbility[] = readonly ClassAbility[],
> = {
    id: string
    name: string
    // Class emblem, also used as the page favicon.
    icon?: string
    abilities: Abilities
    assignments: Readonly<
        Record<
            BoardId,
            Readonly<Record<string, Abilities[number]["id"]>> | undefined
        >
    >
}

// Ability ids that appear more than once in the abilities tuple.
type DuplicateAbilityIds<
    Abilities extends readonly ClassAbility[],
    Seen extends string = never,
> = Abilities extends readonly [
    infer First extends ClassAbility,
    ...infer Rest extends readonly ClassAbility[],
]
    ? First["id"] extends Seen
        ? First["id"] | DuplicateAbilityIds<Rest, Seen>
        : DuplicateAbilityIds<Rest, Seen | First["id"]>
    : never

// Adds an impossible requirement when ids repeat, so the preset fails to
// type-check and the error names the duplicated ids.
type UniqueAbilityIds<Abilities extends readonly ClassAbility[]> = [
    DuplicateAbilityIds<Abilities>,
] extends [never]
    ? unknown
    : { duplicateAbilityIds: DuplicateAbilityIds<Abilities> }

export const defineClassPreset = <
    const Abilities extends readonly ClassAbility[],
>(
    preset: ClassPreset<Abilities> & UniqueAbilityIds<Abilities>,
): ClassPreset<Abilities> => {
    return preset
}
