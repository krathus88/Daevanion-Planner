import type {
    CraftingData,
    CraftingItem,
    ItemGrade,
} from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"
import { getPrice, type CraftPlan, type PlanMaterial } from "./craftPlan"
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

const compareItems = (data: CraftingData, a: CraftingItem, b: CraftingItem) => {
    const kind = getKind(data, a.id) - getKind(data, b.id)
    const family = getSortFamily(data, a.id) - getSortFamily(data, b.id)
    const grade = getGradeRank(a.grade) - getGradeRank(b.grade)

    return kind || family || grade || a.id - b.id
}

// Every item the plan uses but the main craft: gear, then crafted materials,
// then gathered or bought ones; within those by family (a crafted material by
// the family it's made from), then highest grade first. The order doesn't depend on the bag or Buy
// instead, so rows never jump when those change.
export const getMaterialIndex = (
    data: CraftingData,
    settings: PlanSettings,
    plan: CraftPlan,
) => {
    const rows: MaterialIndexRow[] = []

    for (const material of plan.materials) {
        rows.push({
            material: material,
            crafted: false,
            tradable: isTradable(data, material.item.id),
        })
    }

    for (const step of plan.steps.slice(1)) {
        rows.push({
            material: {
                item: step.item,
                need: step.need,
                owned: step.owned,
                missing: step.need - step.owned,
                price: getPrice(settings, step.item.id),
                cost: null,
                morph: null,
                craftable: true,
            },
            crafted: true,
            tradable: isTradable(data, step.item.id),
        })
    }

    return rows.sort((a, b) => {
        return compareItems(data, a.material.item, b.material.item)
    })
}
