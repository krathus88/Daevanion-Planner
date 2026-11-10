import { DAILY_RESET, type FixedSchedule } from "@timers/config/timers"

// Odyle Energy, per character: spent on Expedition, Transcendence and
// Sanctuary reward cubes (most cost 40, 80 with the membership). Recharges 15 every 3 hours up to the
// cap (840 with the Special Quai Membership, 560 without); recharge items add
// extra energy up to 2000 more, spent after the recharged energy. From
// client-data trackers (MetaBot, Timesaver), November 2026.
export const ODYLE_ENERGY = {
    cap: 840,
    freeCap: 560,
    recharge: 15,
    extraCap: 2000,
    cubeCost: 40,
    // The membership injects energy twice per cube, for twice the reward.
    memberCubeCost: 80,
} as const

// The recharge comes every 3 hours in step with the daily reset (01:00,
// 04:00, 07:00 UTC...): checked against the game's countdown, November 2026.
export const ENERGY_RECHARGE: FixedSchedule = {
    anchor: DAILY_RESET.anchor,
    period: 3 * 3_600_000,
    openFor: 0,
}
