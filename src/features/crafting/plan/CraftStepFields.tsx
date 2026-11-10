import { Flex, Grid } from "@chakra-ui/react"
import { NumberField } from "@common/NumberField"
import type { CraftStep } from "@crafting/logic/craftPlan"
import { formatSuccess, type SuccessInfo } from "@crafting/logic/successChance"
import { MAX_AMOUNT } from "@crafting/storage/craftingSettings"
import { BuyInsteadSwitch } from "./BuyInsteadSwitch"
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
    price: number | null
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
    price,
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
                <NumberField
                    value={owned}
                    label="In the bag"
                    max={MAX_AMOUNT}
                    onChange={handleOwnedChange}
                />
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
            {isTarget && tradable && (
                <NumberField
                    value={price}
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
