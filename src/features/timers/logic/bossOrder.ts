import type { FieldBoss } from "@timers/config/fieldBosses"

// Shown first in their region, in this order.
const FIRST_BOSSES: readonly string[] = [
    "gartua",
    "immortal-gartua",
    "lagta",
    "lagta-altgard",
    "dartan",
    "dartan-altgard",
    "kashapa",
    "kashapa-altgard",
]

const getFirstRank = (boss: FieldBoss) => {
    const index = FIRST_BOSSES.indexOf(boss.id)

    return index === -1 ? FIRST_BOSSES.length : index
}

// FIRST_BOSSES first, then longest respawn first, then by name; scheduled
// bosses keep config order.
export const compareBosses = (a: FieldBoss, b: FieldBoss) => {
    return (
        getFirstRank(a) - getFirstRank(b) ||
        (b.respawn ?? 0) - (a.respawn ?? 0) ||
        (a.schedule || b.schedule ? 0 : a.name.localeCompare(b.name))
    )
}
