// Pet Insight levels an unlocked pet can be at; 0 means locked.
export const PET_LEVELS = [1, 2, 3]

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

// Souls needed in total per level; only used to read older saves that
// stored soul counts.
const LEVEL_SOULS = [5, 30, 105]

export const isPetLevel = (value: unknown): value is number => {
    return PET_LEVELS.some((level) => level === value)
}

export const levelFromSouls = (souls: number) => {
    return LEVEL_SOULS.filter((needed) => souls >= needed).length
}

export const getPetLevel = (levels: Record<string, number>, petId: number) => {
    return levels[petId] ?? 0
}
