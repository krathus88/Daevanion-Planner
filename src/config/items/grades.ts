// Highest first; "special" is the boss's own chest.
export type LootGrade =
    "heroic" | "unique" | "epic" | "rare" | "common" | "special"

export const GRADE_LABELS: Record<LootGrade, string> = {
    heroic: "Heroic",
    unique: "Unique",
    epic: "Epic",
    rare: "Rare",
    common: "Common",
    special: "Special",
}
