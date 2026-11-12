import type {
    CraftingData,
    CraftingItem,
    ItemGrade,
} from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"
import {
    getPlanMaterial,
    getPrice,
    type CraftPlan,
    type PlanMaterial,
} from "./craftPlan"
import { isTradable } from "./tradable"

// A row of All materials: something to gather or buy, or an item the plan
// crafts on the way (its need and bag count; no Kinah, it's crafted).
export type MaterialIndexRow = {
    material: PlanMaterial
    crafted: boolean
    tradable: boolean
}

// Highest grade first, like the game lists items (yellow, blue, green,
// white); no grade last.
const GRADE_ORDER: ItemGrade[] = ["heroic", "unique", "epic", "rare", "common"]

const getGradeRank = (grade: ItemGrade | null) => {
    return grade === null ? GRADE_ORDER.length : GRADE_ORDER.indexOf(grade)
}

// The game numbers items by kind: the first six digits are a family (gear
// pieces, Odyle, Sapphire Gemstones…).
const getFamily = (id: number) => {
    return Math.floor(id / 1000)
}

// The family an item sorts in: its own, except a crafted material (no gear
// tab, e.g. Enhanced Thick Balaur Scale) joins the family it's made from
// (Balaur's Essence, its first material), following chains.
const getSortFamily = (data: CraftingData, id: number) => {
    const seen = new Set<number>()
    let current = id

    for (;;) {
        const recipe = data.recipes.get(current)
        const isMaterial =
            recipe !== undefined &&
            (recipe.category === undefined || recipe.category === "materials")

        if (!recipe || !isMaterial || seen.has(current)) {
            return getFamily(current)
        }

        seen.add(current)
        current = recipe.materials[0]?.[0] ?? current
    }
}

// Gear first, then crafted materials, then gathered or bought ones.
const getKind = (data: CraftingData, id: number) => {
    const recipe = data.recipes.get(id)

    if (!recipe) {
        return 2
    }

    return recipe.category === undefined || recipe.category === "materials"
        ? 1
        : 0
}

const tierCache = new WeakMap<CraftingData, Map<number, number>>()

// How far up the gear chain an item is: 0 for anything not gear, else one
// above the highest gear it's made from (Splendent White Dragon Lord, made
// from Artisan's Splendent Orichalcum and the transfers before it, outranks
// it).
export const getGearTier = (data: CraftingData, id: number): number => {
    let tiers = tierCache.get(data)

    if (!tiers) {
        tiers = new Map()
        tierCache.set(data, tiers)
    }

    const known = tiers.get(id)

    if (known !== undefined) {
        return known
    }

    if (getKind(data, id) !== 0) {
        return 0
    }

    // Set first: a recipe loop can't recurse forever.
    tiers.set(id, 1)

    let below = 0

    for (const [material] of data.recipes.get(id)?.materials ?? []) {
        below = Math.max(below, getGearTier(data, material))
    }

    const combo = data.recipes.get(id)?.combo

    // A combo item comes from its base's craft: one above it.
    if (combo) {
        below = Math.max(below, getGearTier(data, combo.base))
    }

    tiers.set(id, below + 1)

    return below + 1
}

// Highest tier gear first; the rest keep their order (sort is stable).
export const compareGearTiers = (data: CraftingData, a: number, b: number) => {
    return getGearTier(data, b) - getGearTier(data, a)
}

const compareItems = (data: CraftingData, a: CraftingItem, b: CraftingItem) => {
    const kind = getKind(data, a.id) - getKind(data, b.id)
    const tier = compareGearTiers(data, a.id, b.id)
    const family = getSortFamily(data, a.id) - getSortFamily(data, b.id)
    const grade = getGradeRank(a.grade) - getGradeRank(b.grade)

    return kind || tier || family || grade || a.id - b.id
}

// Whose materials All materials lists: every craft's down the chain, or only
// the main craft's own.
export type MaterialScope = "chain" | "craft"

// An item the plan crafts on the way: its need and bag count, no Kinah.
const getCraftedRow = (
    data: CraftingData,
    settings: PlanSettings,
    item: CraftingItem,
    need: number,
): MaterialIndexRow => {
    const owned = Math.min(need, settings.owned[item.id] ?? 0)

    return {
        material: {
            item: item,
            need: need,
            owned: owned,
            missing: need - owned,
            price: getPrice(settings, item.id),
            cost: null,
            morph: null,
            craftable: true,
        },
        crafted: true,
        tradable: isTradable(data, item.id),
    }
}

// The main craft's own materials, as many as its attempts use.
const getCraftRows = (
    data: CraftingData,
    settings: PlanSettings,
    plan: CraftPlan,
) => {
    const [target, ...crafted] = plan.steps

    return (target?.uses ?? []).map(([id, need]): MaterialIndexRow => {
        const step = crafted.find((other) => other.item.id === id)

        if (step) {
            return getCraftedRow(data, settings, step.item, need)
        }

        return {
            material: getPlanMaterial(data, settings, id, need),
            crafted: false,
            tradable: isTradable(data, id),
        }
    })
}

// Every item the plan uses but the main craft (or, for "craft", only what the
// main craft itself uses): gear (highest tier first), then crafted materials,
// then gathered or bought ones; within those by family (a crafted material by
// the family it's made from), then highest grade first. The order doesn't depend on the bag or Buy
// instead, so rows never jump when those change.
export const getMaterialIndex = (
    data: CraftingData,
    settings: PlanSettings,
    plan: CraftPlan,
    scope: MaterialScope = "chain",
) => {
    const rows: MaterialIndexRow[] =
        scope === "craft" ? getCraftRows(data, settings, plan) : []

    if (scope === "chain") {
        for (const material of plan.materials) {
            rows.push({
                material: material,
                crafted: false,
                tradable: isTradable(data, material.item.id),
            })
        }

        for (const step of plan.steps.slice(1)) {
            rows.push(getCraftedRow(data, settings, step.item, step.need))
        }
    }

    return rows.sort((a, b) => {
        return compareItems(data, a.material.item, b.material.item)
    })
}
