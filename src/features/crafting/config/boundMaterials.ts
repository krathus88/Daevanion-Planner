// Crafting materials' bound twins: the same material under an item id of its
// own ("Wrathful Mind (Bound)"), kept by one character (it can't go to Server
// Storage). Crafting takes them like the tradable one, so their counts add to
// it. Bound id → tradable id, from AION 2 Hub's item database (2026-11-19:
// every "(Bound)" item whose tradable twin is a recipe material).
export const BOUND_MATERIALS: Record<string, string> = {
    "660511001": "610511013", // Wrathful Mind
    "660511002": "610511014", // Wrathful Will
    "660511003": "610511015", // Wrathful Ego
    "660530001": "610530001", // Refining Stone
    "660530002": "610530005", // Expert's Refining Stone
    "660530003": "610530008", // Artisan's Refining Stone
    "660530004": "610530010", // Artisan's Ultimate Refining Stone
}
