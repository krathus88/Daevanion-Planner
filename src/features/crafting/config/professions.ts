// Professions and their tabs, named and ordered as in the game's crafting
// window.
export const PROFESSION_IDS = [
    "blacksmithing",
    "armorsmithing",
    "handicrafting",
    "alchemy",
    "cooking",
] as const

export type ProfessionId = (typeof PROFESSION_IDS)[number]

export const PROFESSION_NAMES: Record<ProfessionId, string> = {
    blacksmithing: "Blacksmithing",
    armorsmithing: "Armorsmithing",
    handicrafting: "Handicrafting",
    alchemy: "Alchemy",
    cooking: "Cooking",
}

export const CATEGORY_NAMES = {
    greatsword: "Greatsword",
    longsword: "Longsword",
    dagger: "Dagger",
    mace: "Mace",
    guard: "Guard",
    helm: "Helm",
    pauldrons: "Pauldrons",
    top: "Top",
    legs: "Legs",
    gloves: "Gloves",
    shoes: "Shoes",
    cloak: "Cloak",
    bow: "Bow",
    staff: "Staff",
    necklace: "Necklace",
    earrings: "Earrings",
    ring: "Ring",
    bracelet: "Bracelet",
    spellbook: "Spellbook",
    orb: "Orb",
    potion: "Potion",
    scroll: "Scroll",
    manastone: "Manastone",
    food: "Food",
    materials: "Materials",
} as const

export type CategoryId = keyof typeof CATEGORY_NAMES

// Each profession's tabs after All. Items in none of them (Cooking's drinks)
// show only under All.
export const PROFESSION_CATEGORIES: Record<ProfessionId, CategoryId[]> = {
    blacksmithing: [
        "greatsword",
        "longsword",
        "dagger",
        "mace",
        "guard",
        "materials",
    ],
    armorsmithing: [
        "helm",
        "pauldrons",
        "top",
        "legs",
        "gloves",
        "shoes",
        "cloak",
        "materials",
    ],
    handicrafting: [
        "bow",
        "staff",
        "necklace",
        "earrings",
        "ring",
        "bracelet",
        "materials",
    ],
    alchemy: ["spellbook", "orb", "potion", "scroll", "manastone", "materials"],
    cooking: ["food"],
}

export const isProfessionId = (value: unknown): value is ProfessionId => {
    return PROFESSION_IDS.includes(value as ProfessionId)
}

export const isCategoryId = (value: unknown): value is CategoryId => {
    return typeof value === "string" && value in CATEGORY_NAMES
}

// Mastery runs 1-50 per rank: the game shows mastery 60 as the second rank's
// Lv. 10.
export const LEVELS_PER_RANK = 50
export const RANK_NAMES = ["Novice", "Professional"]
// The recipe list's short form; Novice shows as plain "Lv.".
export const RANK_SHORT_NAMES = ["Lv.", "Pro"]

// Percent chance a successful craft makes twice its yield (user-told: every
// Cooking craft makes 1, 30% of the time 2).
export const DOUBLE_CHANCES: Partial<Record<ProfessionId, number>> = {
    cooking: 30,
}
