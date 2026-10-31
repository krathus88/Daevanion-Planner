// Pet Insight levels an unlocked pet can be at; 0 means locked.
export const PET_LEVELS = [1, 2, 3]

export const MAX_PET_LEVEL = 3

type LevelColors = {
    fg: "pet.level1" | "pet.level2" | "pet.level3"
    bg: "pet.level1Muted" | "pet.level2Muted" | "pet.level3Muted"
}

// Theme colors per level, so levels read apart at a glance.
export const LEVEL_COLORS: Record<number, LevelColors> = {
    1: { fg: "pet.level1", bg: "pet.level1Muted" },
    2: { fg: "pet.level2", bg: "pet.level2Muted" },
    3: { fg: "pet.level3", bg: "pet.level3Muted" },
}

// Total souls each level starts at, from locked up: Lv1 takes 5 souls, Lv2 25
// more and Lv3 75 more.
const LEVEL_SOULS = [0, 5, 30, 105]

export const MAX_PET_SOULS = 105

// Souls one purchase from the game's shop gives.
export const BOUGHT_SOULS = 5

export const isPetLevel = (value: unknown): value is number => {
    return PET_LEVELS.some((level) => level === value)
}

export const isPetSouls = (value: unknown): value is number => {
    return (
        typeof value === "number" &&
        Number.isInteger(value) &&
        value >= 0 &&
        value <= MAX_PET_SOULS
    )
}

export const levelFromSouls = (souls: number) => {
    return PET_LEVELS.filter((level) => souls >= LEVEL_SOULS[level]).length
}

export const getLevelStart = (level: number) => {
    return LEVEL_SOULS[level]
}

// Souls from the start of this level to the next; levels below Lv3 only.
export const getLevelNeeded = (level: number) => {
    return LEVEL_SOULS[level + 1] - LEVEL_SOULS[level]
}

// "51/75", like the game's card; null at Lv3 or for a locked pet without souls.
export const getProgressText = (souls: number) => {
    const level = levelFromSouls(souls)

    if (level === MAX_PET_LEVEL || souls === 0) {
        return null
    }

    return `${souls - LEVEL_SOULS[level]}/${getLevelNeeded(level)}`
}

export const getPetLevel = (levels: Record<string, number>, petId: number) => {
    return levels[petId] ?? 0
}

// A pet whose souls were never read counts as just reaching its level.
export const getPetSouls = (
    levels: Record<string, number>,
    souls: Record<string, number>,
    petId: number,
) => {
    return souls[petId] ?? LEVEL_SOULS[getPetLevel(levels, petId)]
}
