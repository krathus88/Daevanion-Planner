import { ENERGY_RECHARGE, ODYLE_ENERGY } from "@tracker/config/odyleEnergy"
import type { TaskEntries } from "@tracker/types"

// Recharged energy and the extra from items.
export type EnergyLeft = {
    base: number
    bonus: number
}

const clamp = (value: number, min: number, max: number) => {
    return Math.min(max, Math.max(min, Math.round(value)))
}

export const getEnergyCap = (membership: boolean) => {
    return membership ? ODYLE_ENERGY.cap : ODYLE_ENERGY.freeCap
}

export const getCubeCost = (membership: boolean) => {
    return membership ? ODYLE_ENERGY.memberCubeCost : ODYLE_ENERGY.cubeCost
}

// How close the recharged energy is to its cap: capped wastes every recharge;
// "soon" caps within the next 2 recharges.
export type EnergyLevel = "ok" | "soon" | "capped"

export const getEnergyLevel = (base: number, cap: number): EnergyLevel => {
    if (base >= cap) {
        return "capped"
    }

    return base + 2 * ODYLE_ENERGY.recharge >= cap ? "soon" : "ok"
}

// Which recharge `now` falls in; one more every 3 hours.
export const getEnergyPeriod = (now: number) => {
    return Math.floor((now - ENERGY_RECHARGE.anchor) / ENERGY_RECHARGE.period)
}

export const getNextRecharge = (now: number) => {
    return (
        ENERGY_RECHARGE.anchor +
        (getEnergyPeriod(now) + 1) * ENERGY_RECHARGE.period
    )
}

// Energy in `period`: each recharge since the save adds 15, up to the cap.
// Never saved means full.
export const readEnergy = (
    saved: TaskEntries | undefined,
    period: number,
    cap: number,
): EnergyLeft => {
    if (!saved) {
        return { base: cap, bonus: 0 }
    }

    const recharges = Math.max(0, period - saved.period)

    return {
        base: Math.min(cap, saved.base + recharges * ODYLE_ENERGY.recharge),
        bonus: saved.bonus,
    }
}

export const clampEnergy = (left: EnergyLeft, cap: number): EnergyLeft => {
    return {
        base: clamp(left.base, 0, cap),
        bonus: clamp(left.bonus, 0, ODYLE_ENERGY.extraCap),
    }
}

// A cube takes `amount` at once, the recharged energy first, then the extra.
export const spendEnergy = (left: EnergyLeft, amount: number): EnergyLeft => {
    const fromBase = Math.min(left.base, amount)

    return {
        base: left.base - fromBase,
        bonus: Math.max(0, left.bonus - (amount - fromBase)),
    }
}
