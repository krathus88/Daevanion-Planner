import type { ProfessionId } from "@crafting/config/professions"

// A price as set on this device. Null is cleared; `at` (ms) is when, so it
// can be weighed against the server's shared price.
export type LocalPrice = {
    value: number | null
    at: number
}

// What the user enters, by item id. Saved to the account.
export type CraftingSettings = {
    // Server id: its faction's recipes show, and prices are per server.
    server: string
    // Items already in the bag.
    owned: Record<string, number>
    // Kinah per item, per server id.
    prices: Record<string, Record<string, LocalPrice>>
    // Craftable items the user buys instead of crafting.
    bought: number[]
    // Chance a craft succeeds, in percent (1-100), set by hand; missing uses
    // the game's table at your proficiency.
    success: Record<string, number>
    // Proficiency per profession, as the game's level number (61 is
    // Professional Lv. 11).
    proficiency: Partial<Record<ProfessionId, number>>
}

// What a plan is worked out from: the settings with each item's price picked
// (local or shared), and market prices, which win where they exist.
export type PlanSettings = {
    owned: Record<string, number>
    prices: Record<string, number>
    // Aion2Market's prices: they win over `prices`.
    marketPrices: Record<string, number>
    // Items whose market price is still being fetched.
    pendingPrices: Record<string, true>
    bought: number[]
    success: Record<string, number>
    proficiency: Partial<Record<ProfessionId, number>>
}
