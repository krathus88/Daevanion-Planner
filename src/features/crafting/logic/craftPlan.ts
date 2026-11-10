import {
    getItem,
    getProcs,
    type CraftingData,
    type CraftingItem,
    type Recipe,
} from "@crafting/data/craftingData"
import {
    DOUBLE_CHANCES,
    PROFESSION_IDS,
    type ProfessionId,
} from "@crafting/config/professions"
import { MERCHANT_PRICES } from "@crafting/config/merchantPrices"
import { getMorphSource } from "@crafting/config/substanceMorph"
import type { PlanSettings } from "@crafting/types"
import { getRecipeSuccess } from "./successChance"
import { isTradable } from "./tradable"

// One item crafted along the way, the target first.
export type CraftStep = {
    item: CraftingItem
    recipe: Recipe
    // Items the steps above use (or the target count).
    need: number
    // Of those, taken from the bag.
    owned: number
    // Successful crafts: what's left over the average yield, rounded up.
    crafts: number
    // Crafts to start, counting failures and, for a combo item, the crafts
    // that make only the base item. Rounded up from the average.
    attempts: number
    // Chance one attempt gives this item, 0-1.
    chance: number
    // A combo item's base item, made by the attempts that don't proc (each
    // attempt uses up every material, lower-tier gear included). About this
    // many, on average.
    leftover: { item: CraftingItem; count: number } | null
    // Made straight from its base's combo instead of crafting it from the
    // base (e.g. White Dragon Lord Ring procs Splendent White, skipping that
    // transfer): about how many, at what chance.
    skipped: { chance: number; count: number } | null
    // Splendent items its crafts can proc (the game's Combo Activation
    // Chance), and about how many these attempts make.
    procs: { item: CraftingItem; chance: number; count: number }[]
}

// An item to gather or buy: a raw material, or a craftable one marked bought.
export type PlanMaterial = {
    item: CraftingItem
    need: number
    owned: number
    missing: number
    // Kinah per item, when set.
    price: number | null
    // Kinah for the missing ones, when priced: at the Odyle's price when
    // `morph` is set.
    cost: number | null
    // The Odyle it's cheaper to Substance Morph from, and its price.
    morph: { item: CraftingItem; price: number } | null
    // Could be crafted, but is bought instead.
    craftable: boolean
}

export type CraftPlan = {
    steps: CraftStep[]
    materials: PlanMaterial[]
    attempts: number
    // Kinah for every priced missing material.
    cost: number
    // Missing materials with no price, left out of cost.
    unpriced: number
}

// A fixed price: a merchant's (always), else the market's.
export type ListedPrice = { value: number; source: "merchant" | "market" }

export const getListedPrice = (
    settings: PlanSettings,
    id: number,
): ListedPrice | null => {
    const merchant = MERCHANT_PRICES[id]
    const market = settings.marketPrices[id]

    if (merchant !== undefined) {
        return { value: merchant, source: "merchant" }
    }

    return market === undefined ? null : { value: market, source: "market" }
}

// The price a plan counts: a merchant's, else the market's (the real one),
// else one set by hand (yours or your server's).
export const getPrice = (settings: PlanSettings, id: number) => {
    return getListedPrice(settings, id)?.value ?? settings.prices[id] ?? null
}

// A price set by hand: what a price field edits, shown only where there's no
// merchant or market price.
const getOwnPrice = (settings: PlanSettings, id: number) => {
    return settings.prices[id] ?? null
}

// What an item's price spot shows: its fixed price, a loading placeholder
// while the market is asked, else the field for a price set by hand.
export type PriceState =
    | { kind: "listed"; price: ListedPrice }
    | { kind: "loading" }
    | { kind: "own"; value: number | null }

export const getPriceState = (
    settings: PlanSettings,
    id: number,
): PriceState => {
    const listed = getListedPrice(settings, id)

    if (listed) {
        return { kind: "listed", price: listed }
    }

    return settings.pendingPrices[id]
        ? { kind: "loading" }
        : { kind: "own", value: getOwnPrice(settings, id) }
}

// What an item costs to get: its own price, or the Odyle it can be Substance
// Morphed from (1 for 1) when that's cheaper or it has no price.
export const getBuyPrice = (settings: PlanSettings, id: number) => {
    const price = getPrice(settings, id)
    const source = getMorphSource(id)
    const odyle = source === undefined ? null : getPrice(settings, source)

    if (source !== undefined && odyle !== null) {
        if (price === null || odyle < price) {
            return { value: odyle, morph: source }
        }
    }

    return { value: price, morph: null }
}

const isCrafted = (
    data: CraftingData,
    settings: PlanSettings,
    id: number,
    targetId: number,
) => {
    // The target is always crafted, even when also marked bought elsewhere;
    // so is an item the market doesn't sell.
    return (
        data.recipes.has(id) &&
        (id === targetId ||
            !isTradable(data, id) ||
            !settings.bought.includes(id))
    )
}

// Items one successful craft makes on average: its yield, plus the chance of
// a double (Cooking).
export const getAverageYield = (recipe: Recipe) => {
    const double = DOUBLE_CHANCES[recipe.profession] ?? 0

    return recipe.yield * (1 + double / 100)
}

// Chance one attempt at this recipe gives its item, 0-1.
export const getCraftChance = (recipe: Recipe, success: number) => {
    const combo = recipe.combo?.only ? recipe.combo.chance / 100 : 1

    return (success / 100) * combo
}

// Chance, 0-1, that an item comes straight from its base's combo, skipping
// its own craft: its recipe is also a combo of its base (not combo-only), the
// base is one of its materials, and the plan crafts the base. Each item then
// still takes one base craft, but only the rest need this recipe.
export const getSkipChance = (
    recipe: Recipe,
    isBaseCrafted: (baseId: number) => boolean,
) => {
    const combo = recipe.combo

    if (
        !combo ||
        combo.only ||
        !recipe.materials.some(([id]) => id === combo.base) ||
        !isBaseCrafted(combo.base)
    ) {
        return 0
    }

    return combo.chance / 100
}

// Crafted items, every item before the ones it's made from, so each item's
// whole need is known before it's split into materials.
const getCraftOrder = (
    data: CraftingData,
    settings: PlanSettings,
    targetId: number,
) => {
    const done = new Set<number>()
    const visiting = new Set<number>()
    const order: number[] = []

    const visit = (id: number) => {
        if (done.has(id) || visiting.has(id)) {
            return
        }

        visiting.add(id)

        for (const [materialId] of data.recipes.get(id)?.materials ?? []) {
            if (isCrafted(data, settings, materialId, targetId)) {
                visit(materialId)
            }
        }

        visiting.delete(id)
        done.add(id)
        order.push(id)
    }

    visit(targetId)

    return order.reverse()
}

// A recipe that (through others) needs its own item would loop forever; the
// second time an item comes up below itself, it's treated as a material.
const getLoopItems = (
    data: CraftingData,
    settings: PlanSettings,
    order: number[],
    targetId: number,
) => {
    const position = new Map(order.map((id, index) => [id, index]))
    const loops = new Set<number>()

    for (const id of order) {
        for (const [materialId] of data.recipes.get(id)?.materials ?? []) {
            const index = position.get(materialId)

            if (
                index !== undefined &&
                index <= (position.get(id) ?? 0) &&
                isCrafted(data, settings, materialId, targetId)
            ) {
                loops.add(materialId)
            }
        }
    }

    return loops
}

export const buildCraftPlan = (
    data: CraftingData,
    settings: PlanSettings,
    targetId: number,
    count: number,
): CraftPlan => {
    const order = getCraftOrder(data, settings, targetId)
    const loops = getLoopItems(data, settings, order, targetId)
    const needs = new Map<number, number>([[targetId, count]])
    const rawNeeds = new Map<number, number>()
    const steps: CraftStep[] = []
    const materials: PlanMaterial[] = []
    let attempts = 0
    let cost = 0
    let unpriced = 0

    const addNeed = (id: number, amount: number) => {
        // A step the bag covers still shows, but needs nothing.
        if (amount === 0) {
            return
        }

        const crafted =
            isCrafted(data, settings, id, targetId) && !loops.has(id)
        const map = crafted ? needs : rawNeeds

        map.set(id, (map.get(id) ?? 0) + amount)
    }

    for (const id of order) {
        const recipe = data.recipes.get(id)
        const need = needs.get(id) ?? 0

        if (!recipe || need === 0) {
            continue
        }

        // The target count is how many more to make, whatever is in the bag.
        const owned =
            id === targetId ? 0 : Math.min(need, settings.owned[id] ?? 0)
        // Slack as for attempts below, so 13 / 1.3 stays 10.
        const crafts = Math.max(
            0,
            Math.ceil((need - owned) / getAverageYield(recipe) - 1e-9),
        )
        const success = getRecipeSuccess(data, settings, recipe)
        const chance = getCraftChance(recipe, success)
        const skip = getSkipChance(recipe, (baseId) => {
            return (
                isCrafted(data, settings, baseId, targetId) &&
                !loops.has(baseId)
            )
        })
        // The crafts its base's combo doesn't cover; rounded with a little
        // slack so 3 / 0.3 doesn't become 11 (and 0 doesn't become -0).
        const ownAttempts = (crafts * (1 - skip)) / chance
        const stepAttempts = Math.max(0, Math.ceil(ownAttempts - 1e-9))
        const combo = recipe.combo

        for (const [materialId, materialCount] of recipe.materials) {
            // A skipping item's base: one craft per item, proc or not.
            const uses =
                skip > 0 && materialId === combo?.base
                    ? Math.max(0, Math.ceil(ownAttempts + crafts * skip - 1e-9))
                    : stepAttempts

            addNeed(materialId, materialCount * uses)
        }

        steps.push({
            item: getItem(data, id),
            recipe: recipe,
            need: need,
            owned: owned,
            crafts: crafts,
            attempts: stepAttempts,
            chance: chance,
            leftover:
                combo?.only && stepAttempts > crafts
                    ? {
                          item: getItem(data, combo.base),
                          count: Math.round(
                              stepAttempts * (success / 100) - crafts,
                          ),
                      }
                    : null,
            skipped:
                skip > 0
                    ? { chance: skip, count: Math.round(crafts * skip) }
                    : null,
            procs: getProcs(data, id).map((proc) => {
                return {
                    item: getItem(data, proc.id),
                    chance: proc.chance,
                    count: Math.round(
                        stepAttempts * (success / 100) * (proc.chance / 100),
                    ),
                }
            }),
        })
        attempts += stepAttempts
    }

    for (const [id, need] of rawNeeds) {
        const owned = Math.min(need, settings.owned[id] ?? 0)
        const missing = need - owned
        const price = getPrice(settings, id)
        const buy = getBuyPrice(settings, id)
        const materialCost = buy.value === null ? null : buy.value * missing

        if (materialCost !== null) {
            cost += materialCost
        } else if (missing > 0) {
            unpriced++
        }

        materials.push({
            item: getItem(data, id),
            need: need,
            owned: owned,
            missing: missing,
            price: price,
            cost: materialCost,
            morph:
                buy.morph === null || buy.value === null
                    ? null
                    : { item: getItem(data, buy.morph), price: buy.value },
            craftable: data.recipes.has(id),
        })
    }

    return {
        steps: steps,
        materials: materials,
        attempts: attempts,
        cost: cost,
        unpriced: unpriced,
    }
}

// The professions whose proficiency sets the plan's chances: every crafted
// step's but Transfer Crafting's, in the game's order.
export const getPlanProfessions = (plan: CraftPlan) => {
    const professions = new Set<ProfessionId>()

    for (const step of plan.steps) {
        if (!step.recipe.transfer) {
            professions.add(step.recipe.profession)
        }
    }

    return PROFESSION_IDS.filter((profession) => professions.has(profession))
}
