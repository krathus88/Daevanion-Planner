export type FinishChance = {
    // Crafts made in all.
    crafts: number
    // Chance, 0-1, that they're enough.
    chance: number
}

// Ways to pick `count` of `total`.
const choose = (total: number, count: number) => {
    let result = 1

    for (let index = 0; index < count; index++) {
        result = (result * (total - index)) / (index + 1)
    }

    return result
}

import type { Recipe } from "@crafting/data/craftingData"

// Successful crafts it takes to make `count`; a Cooking double left out.
export const getSuccessesNeeded = (recipe: Recipe, count: number) => {
    return Math.ceil(count / recipe.yield)
}

// The chance that `successes` crafts succeed within that many crafts and the
// next `extra` ones, each succeeding with `chance` (0-1): at most that many
// fail, so only a few terms even for thousands of crafts. A sure craft has
// just the one.
export const getFinishChances = (
    chance: number,
    successes: number,
    extra = 2,
): FinishChance[] => {
    const result: FinishChance[] = []

    const most = chance >= 1 ? 0 : extra

    for (let failures = 0; failures <= most; failures++) {
        const crafts = successes + failures
        let total = 0

        for (let failed = 0; failed <= failures; failed++) {
            total +=
                choose(crafts, failed) *
                (1 - chance) ** failed *
                chance ** (crafts - failed)
        }

        result.push({ crafts: crafts, chance: Math.min(1, total) })
    }

    return result
}
