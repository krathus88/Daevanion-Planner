import {
    getItem,
    type CraftingData,
    type CraftingItem,
    type Recipe,
} from "@crafting/data/craftingData"
import type { PlanSettings } from "@crafting/types"
import {
    getBuyPrice,
    getPrice,
    type CraftPlan,
    type CraftStep,
    type PlanMaterial,
} from "./craftPlan"
import { isTradable } from "./tradable"
import { getCraftCost } from "./unitCost"

// One material of a recipe in the craft tree.
export type TreeLine = {
    item: CraftingItem
    // What one craft of the parent uses.
    perCraft: number
    // Its own price (to buy, or for the main craft to sell), as set.
    price: number | null
    // False for Transfer Crafting items: the market doesn't sell them.
    tradable: boolean
    // The Odyle it's cheaper to Substance Morph from, and that price.
    morph: { item: CraftingItem; price: number } | null
    // Average Kinah to craft one, when the plan crafts it and every material
    // is priced.
    craftCost: number | null
    // How many the whole plan needs, wherever it's used; 0 when the item's
    // plan is already covered higher up.
    planNeed: number
    // The bag covers the plan's need.
    covered: boolean
    // Set when the plan crafts it: the line opens into its own recipe.
    step: CraftStep | null
    // Set when the plan gathers or buys it.
    material: PlanMaterial | null
}

const getMorph = (data: CraftingData, settings: PlanSettings, id: number) => {
    const buy = getBuyPrice(settings, id)

    return buy.morph === null || buy.value === null
        ? null
        : { item: getItem(data, buy.morph), price: buy.value }
}

// Plan steps and materials by item id, looked up once per plan.
export type PlanIndex = {
    steps: Map<number, CraftStep>
    materials: Map<number, PlanMaterial>
}

export const indexPlan = (plan: CraftPlan): PlanIndex => {
    const steps = new Map<number, CraftStep>()
    const materials = new Map<number, PlanMaterial>()

    for (const step of plan.steps) {
        steps.set(step.item.id, step)
    }

    for (const material of plan.materials) {
        materials.set(material.item.id, material)
    }

    return { steps: steps, materials: materials }
}

// The lines under a recipe: what each craft of it uses, with each item's unit
// cost and plan total.
export const getTreeLines = (
    data: CraftingData,
    settings: PlanSettings,
    index: PlanIndex,
    recipe: Recipe,
) => {
    const lines: TreeLine[] = []

    for (const [id, perCraft] of recipe.materials) {
        const step = index.steps.get(id) ?? null
        const material = step ? null : (index.materials.get(id) ?? null)

        lines.push({
            item: getItem(data, id),
            perCraft: perCraft,
            price: getPrice(settings, id),
            tradable: isTradable(data, id),
            morph: getMorph(data, settings, id),
            craftCost: step ? getCraftCost(data, settings, id) : null,
            planNeed: step?.need ?? material?.need ?? 0,
            covered: step
                ? step.owned >= step.need
                : (material?.missing ?? 0) === 0,
            step: step,
            material: material,
        })
    }

    return lines
}
