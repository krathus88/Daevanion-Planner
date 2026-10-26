import type { MainBoardId } from "@config/boards"

type ClassAbilityType = "skill" | "passive"

export type ClassAbility = {
    id: string
    name: string
    type: ClassAbilityType
    priority?: number
    icon?: string
    tooltip?: string
    // Seconds, or "X" when it changes with skill level.
    cooldown?: number | "X"
    // Levels are per unlock; they differ between skills and stigmas.
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
    icon?: string
    abilities: Abilities
    assignments: Readonly<
        Record<
            MainBoardId,
            Readonly<Record<string, Abilities[number]["id"]>> | undefined
        >
    >
}

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

// Fails type-checking on repeated ids, naming them in the error.
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
