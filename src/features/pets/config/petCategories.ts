export const PET_CATEGORY_IDS = [
    "cogni",
    "fera",
    "natura",
    "varian",
    "special",
] as const

export type PetCategoryId = (typeof PET_CATEGORY_IDS)[number]

export const PET_CATEGORY_NAMES: Record<PetCategoryId, string> = {
    cogni: "Cogni",
    fera: "Fera",
    natura: "Natura",
    varian: "Varian",
    special: "Special",
}

export const isPetCategoryId = (value: unknown): value is PetCategoryId => {
    return PET_CATEGORY_IDS.some((id) => id === value)
}
