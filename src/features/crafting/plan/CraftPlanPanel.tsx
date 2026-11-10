import { Flex, Text } from "@chakra-ui/react"
import { Card } from "@common/Card"
import type { ProfessionId } from "@crafting/config/professions"
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
    getPlanProfessions,
    getPrice,
} from "@crafting/logic/craftPlan"
import { indexPlan } from "@crafting/logic/craftTree"
import { isTradable } from "@crafting/logic/tradable"
import { describeRecipe } from "@crafting/logic/recipeLabels"
import { getCraftCost, getThisCraftCost } from "@crafting/logic/unitCost"
import type { PlanSettings } from "@crafting/types"
import { PlanContext } from "@crafting/context/planContext"
import { getCraftedFrom } from "@crafting/logic/craftedFrom"
import { AllMaterials } from "./AllMaterials"
import { ComboCard } from "./ComboCard"
import { CraftedFromLinks } from "./CraftedFromLinks"
import { CraftStepBody } from "./CraftStepBody"
import { PlanSummary } from "./PlanSummary"
import { ProficiencyField } from "./ProficiencyField"
import { TransferComboCard } from "./TransferComboCard"

// The most a plan makes at once.
export const MAX_CRAFT_COUNT = 9999

type CraftPlanPanelProps = {
    data: CraftingData
    item: CraftingItem
    recipe: Recipe
    count: number
    settings: PlanSettings
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

export const CraftPlanPanel = ({
    data,
    item,
    recipe,
    count,
    settings,
    onCountChange,
    onOwnedChange,
    onSuccessChange,
    onPriceChange,
    onBoughtChange,
    onProficiencyChange,
    onItemSelect,
}: CraftPlanPanelProps) => {
    const handleCountChange = (value: number | null) => {
        onCountChange(value ?? 1)
    }

    const plan = buildCraftPlan(data, settings, item.id, count)
    // A base item's combo proc, shown in its own card.
    const proc = getProcs(data, recipe.id)[0]
    // A proc that skips a Transfer Crafting step (Splendent White, Splendent
    // True): bound gear, so what it skips, not odds and market prices.
    const transferProc =
        proc !== undefined &&
        (recipe.transfer === true ||
            data.recipes.get(proc.id)?.transfer === true)
    const handlers = {
        onOwnedChange: onOwnedChange,
        onSuccessChange: onSuccessChange,
        onPriceChange: onPriceChange,
        onBoughtChange: onBoughtChange,
        onItemSelect: onItemSelect,
    }
    const professions = getPlanProfessions(plan)

    return (
        // Item mentions in the texts read recipes and prices from here.
        <PlanContext.Provider value={{ data: data, settings: settings }}>
            <Flex minW="0" flexDir="column" gap="4">
                <Card>
                    <Flex flexWrap="wrap" alignItems="flex-end" gap="4">
                        <Flex minW="0" flex="1">
                            <ItemName
                                item={item}
                                size="md"
                                caption={describeRecipe(data, recipe)}
                            />
                        </Flex>

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

                    <CraftedFromLinks
                        items={getCraftedFrom(data, recipe)}
                        onSelect={onItemSelect}
                    />

                    {professions.length > 0 && (
                        <Flex flexWrap="wrap" gap="4">
                            {professions.map((profession) => (
                                <ProficiencyField
                                    key={profession}
                                    profession={profession}
                                    value={
                                        settings.proficiency[profession] ?? null
                                    }
                                    onChange={onProficiencyChange}
                                />
                            ))}
                        </Flex>
                    )}

                    {recipe.variants > 1 && (
                        <Text textStyle="hint">
                            The game has {recipe.variants} recipes for this
                            item; this is one of them.
                        </Text>
                    )}

                    <PlanSummary
                        plan={plan}
                        costEach={getCraftCost(data, settings, item.id)}
                        thisCraftEach={getThisCraftCost(
                            data,
                            settings,
                            item.id,
                        )}
                        sellPrice={getPrice(settings, item.id)}
                        tradable={isTradable(data, item.id)}
                        pricesLoading={arePricesLoading(settings)}
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
                        attempts={plan.steps[0]?.attempts ?? 0}
                        splendentId={proc.id}
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
}
