import { Flex, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import type { ProfessionId } from "@crafting/config/professions"
import { MAX_CRAFT_COUNT } from "@crafting/config/craftCount"
import { NumberField } from "@common/NumberField"
import {
    getProcs,
    type CraftingData,
    type CraftingItem,
    type Recipe,
} from "@crafting/data/craftingData"
import { ItemName } from "@crafting/ItemName"
import {
    arePricesLoading,
    buildCraftPlan,
    getCraftChance,
    getPlanProfessions,
    getPrice,
    getPriceState,
} from "@crafting/logic/craftPlan"
import { indexPlan } from "@crafting/logic/craftTree"
import { isTradable } from "@crafting/logic/tradable"
import { describeRecipe } from "@crafting/logic/recipeLabels"
import { formatSuccess, getSuccessInfo } from "@crafting/logic/successChance"
import {
    describeBlocked,
    describeOddsHint,
} from "@crafting/logic/summaryLabels"
import { getFinishChances, getSuccessesNeeded } from "@crafting/logic/craftOdds"
import { getAttemptCost, getCraftsEach } from "@crafting/logic/unitCost"
import type { PlanSettings } from "@crafting/types"
import { PlanContext } from "@crafting/context/planContext"
import { getCraftedFrom } from "@crafting/logic/craftedFrom"
import { memo } from "react"
import { AllMaterials } from "./AllMaterials"
import { ComboCard } from "./ComboCard"
import { CraftedFromLinks } from "./CraftedFromLinks"
import { CraftStepBody } from "./CraftStepBody"
import { PlanSummary } from "./PlanSummary"
import { ProficiencyField } from "./ProficiencyField"
import { TransferComboCard } from "./TransferComboCard"

type CraftPlanPanelProps = {
    data: CraftingData
    item: CraftingItem
    recipe: Recipe
    count: number
    settings: PlanSettings
    // The chosen character's crafting levels come from the companion app.
    proficiencyLocked: boolean
    onCountChange: (count: number) => void
    onOwnedChange: (itemId: number, owned: number) => void
    onSuccessChange: (itemId: number, success: number | null) => void
    onPriceChange: (itemId: number, price: number | null) => void
    onBoughtChange: (itemId: number, bought: boolean) => void
    onProficiencyChange: (
        profession: ProfessionId,
        level: number | null,
    ) => void
    // Opens another item's craft (Crafted from).
    onItemSelect: (itemId: number) => void
}

// memo: the Crafting page re-renders whenever its settings change, e.g. the
// companion app's pickups; the plan rebuilds only when its own inputs do
// (its bag counts are just the open tree's, `pickOwned`).
export const CraftPlanPanel = memo(function CraftPlanPanel({
    data,
    item,
    recipe,
    count,
    settings,
    proficiencyLocked,
    onCountChange,
    onOwnedChange,
    onSuccessChange,
    onPriceChange,
    onBoughtChange,
    onProficiencyChange,
    onItemSelect,
}: CraftPlanPanelProps) {
    const handleCountChange = (value: number | null) => {
        onCountChange(value ?? 1)
    }

    // The main item's own price, when the market has none.
    const handleSellPriceChange = (value: number | null) => {
        onPriceChange(item.id, value)
    }

    // A percent set by hand over the game's table; empty goes back to it.
    const handleSuccessChange = (value: number | null) => {
        onSuccessChange(item.id, value)
    }

    const plan = buildCraftPlan(data, settings, item.id, count)
    // A base item's combo proc, shown in its own card.
    const proc = getProcs(data, recipe.id)[0]
    // Transfer Crafting's procs are bound (Splendent White): what one skips,
    // not odds and market prices. A Crafting proc is sold (user-told), even
    // one that skips a transfer (Splendent True Dragon Lord gear).
    const transferProc = proc !== undefined && recipe.transfer === true
    const handlers = {
        onOwnedChange: onOwnedChange,
        onSuccessChange: onSuccessChange,
        onPriceChange: onPriceChange,
        onBoughtChange: onBoughtChange,
        onItemSelect: onItemSelect,
    }
    const professions = getPlanProfessions(plan)
    const craftsEach = getCraftsEach(data, settings, recipe)
    const success = getSuccessInfo(data, settings, recipe)

    return (
        // Item mentions in the texts read recipes and prices from here.
        <PlanContext.Provider value={{ data: data, settings: settings }}>
            <Flex minW="0" flexDir="column" gap="4">
                <Card>
                    <Flex flexWrap="wrap" alignItems="flex-start" gap="4">
                        <Flex minW="0" flex="1" flexDir="column" gap="2">
                            <ItemName
                                item={item}
                                size="md"
                                caption={describeRecipe(data, recipe)}
                            />

                            <CraftedFromLinks
                                items={getCraftedFrom(data, recipe)}
                                onSelect={onItemSelect}
                            />
                        </Flex>

                        <Flex flexWrap="wrap" alignItems="flex-end" gap="4">
                            {professions.map((profession) => (
                                <ProficiencyField
                                    key={profession}
                                    profession={profession}
                                    value={
                                        settings.proficiency[profession] ?? null
                                    }
                                    locked={proficiencyLocked}
                                    onChange={onProficiencyChange}
                                />
                            ))}

                            {/* Transfer Crafting is guaranteed to succeed. */}
                            {!recipe.transfer && (
                                <Flex w="24">
                                    <NumberField
                                        value={
                                            settings.success[item.id] ?? null
                                        }
                                        label="Success %"
                                        fallback={null}
                                        min={1}
                                        max={100}
                                        placeholder={formatSuccess(success)}
                                        onChange={handleSuccessChange}
                                    />
                                </Flex>
                            )}

                            <Flex w="24">
                                <NumberField
                                    value={count}
                                    label="How many"
                                    fallback={1}
                                    min={1}
                                    max={MAX_CRAFT_COUNT}
                                    onChange={handleCountChange}
                                />
                            </Flex>
                        </Flex>
                    </Flex>

                    {recipe.variants > 1 && (
                        <Text textStyle="hint">
                            The game has {recipe.variants} recipes for this
                            item; this is one of them.
                        </Text>
                    )}

                    <PlanSummary
                        plan={plan}
                        attemptCost={getAttemptCost(data, settings, item.id)}
                        craftsEach={craftsEach}
                        finishes={getFinishChances(
                            getCraftChance(recipe, success.value),
                            getSuccessesNeeded(recipe, count),
                        )}
                        oddsHint={describeOddsHint(recipe, success)}
                        blocked={describeBlocked(recipe, success)}
                        count={count}
                        sellPrice={getPrice(settings, item.id)}
                        sellPriceState={getPriceState(settings, item.id)}
                        tradable={isTradable(data, item.id)}
                        pricesLoading={arePricesLoading(settings)}
                        onSellPriceChange={handleSellPriceChange}
                    />
                </Card>

                {proc && transferProc && (
                    <TransferComboCard
                        data={data}
                        baseId={recipe.id}
                        settings={settings}
                        splendentId={proc.id}
                        comboChance={proc.chance}
                    />
                )}

                {proc && !transferProc && (
                    <ComboCard
                        data={data}
                        recipe={recipe}
                        settings={settings}
                        splendentId={proc.soldId}
                        comboChance={proc.chance}
                        onPriceChange={onPriceChange}
                    />
                )}

                <Card>
                    <Text textStyle="label">Main craft</Text>

                    <CraftStepBody
                        data={data}
                        step={plan.steps[0]}
                        settings={settings}
                        index={indexPlan(plan)}
                        isTarget
                        handlers={handlers}
                    />
                </Card>

                <AllMaterials
                    data={data}
                    plan={plan}
                    settings={settings}
                    onOwnedChange={onOwnedChange}
                    onPriceChange={onPriceChange}
                    onBoughtChange={onBoughtChange}
                    onItemSelect={onItemSelect}
                />
            </Flex>
        </PlanContext.Provider>
    )
})
