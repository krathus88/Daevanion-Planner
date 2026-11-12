import { Flex, Grid } from "@chakra-ui/react"
import { NumberField } from "@common/NumberField"
import type { CraftStep, PriceState } from "@crafting/logic/craftPlan"
import { formatSuccess, type SuccessInfo } from "@crafting/logic/successChance"
import { MAX_AMOUNT } from "@crafting/storage/craftingSettings"
import { BagCountField } from "./BagCountField"
import { BuyInsteadSwitch } from "./BuyInsteadSwitch"
import { ListedPriceText } from "./ListedPriceText"
import { PriceLoading } from "./PriceLoading"
import type { PlanHandlers } from "./planHandlers"
import { STEP_FIELD_COLUMNS } from "./stepFieldColumns"

type CraftStepFieldsProps = {
    step: CraftStep
    isTarget: boolean
    // False for Transfer Crafting: no sell price, never bought instead.
    tradable: boolean
    owned: number
    success: SuccessInfo
    // A percent set by hand, or null to use the game's table.
    manualSuccess: number | null
    // What its price spot shows: fixed, loading, or the field.
    priceState: PriceState
    handlers: PlanHandlers
}

// A crafted item's bag count, success and Buy instead (its price is on its
// tree line); the main craft has only success and what it sells for.
export const CraftStepFields = ({
    step,
    isTarget,
    tradable,
    owned,
    success,
    manualSuccess,
    priceState,
    handlers,
}: CraftStepFieldsProps) => {
    const itemId = step.item.id

    const handleOwnedChange = (value: number | null) => {
        handlers.onOwnedChange(itemId, value ?? 0)
    }

    const handleSuccessChange = (value: number | null) => {
        handlers.onSuccessChange(itemId, value)
    }

    const handlePriceChange = (value: number | null) => {
        handlers.onPriceChange(itemId, value)
    }

    const handleBoughtChange = (bought: boolean) => {
        handlers.onBoughtChange(itemId, bought)
    }

    return (
        <Grid templateColumns={STEP_FIELD_COLUMNS} alignItems="end" gap="3">
            {!isTarget && (
                <BagCountField owned={owned} onChange={handleOwnedChange} />
            )}

            {/* Transfer Crafting is guaranteed to succeed. */}
            {!step.recipe.transfer && (
                <NumberField
                    value={manualSuccess}
                    label="Success %"
                    fallback={null}
                    min={1}
                    max={100}
                    placeholder={formatSuccess(success)}
                    onChange={handleSuccessChange}
                />
            )}

            {/* Other crafts' prices are on their tree line. */}
            {isTarget && tradable && priceState.kind === "listed" && (
                <ListedPriceText
                    label="Sells for (Kinah)"
                    price={priceState.price}
                />
            )}

            {isTarget && tradable && priceState.kind === "loading" && (
                <PriceLoading label="Sells for (Kinah)" />
            )}

            {isTarget && tradable && priceState.kind === "own" && (
                <NumberField
                    value={priceState.value}
                    label="Sells for (Kinah)"
                    fallback={null}
                    max={MAX_AMOUNT}
                    placeholder="—"
                    onChange={handlePriceChange}
                />
            )}

            {!isTarget && tradable && (
                <Flex h="8" alignItems="center">
                    <BuyInsteadSwitch
                        checked={false}
                        onChange={handleBoughtChange}
                    />
                </Flex>
            )}
        </Grid>
    )
}
