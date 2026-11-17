import { Flex, Grid } from "@chakra-ui/react"
import { NumberField } from "@common/NumberField"
import type { CraftStep } from "@crafting/logic/craftPlan"
import { formatSuccess, type SuccessInfo } from "@crafting/logic/successChance"
import { BagCountField } from "./BagCountField"
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
    handlers: PlanHandlers
}

// A crafted item's bag count, success and Buy instead (its price is on its
// tree line); nothing for the main craft (its fields are in the item card).
export const CraftStepFields = ({
    step,
    isTarget,
    tradable,
    owned,
    success,
    manualSuccess,
    handlers,
}: CraftStepFieldsProps) => {
    const itemId = step.item.id

    const handleOwnedChange = (value: number | null) => {
        handlers.onOwnedChange(itemId, value ?? 0)
    }

    const handleSuccessChange = (value: number | null) => {
        handlers.onSuccessChange(itemId, value)
    }

    const handleBoughtChange = (bought: boolean) => {
        handlers.onBoughtChange(itemId, bought)
    }

    // The main craft's success and sell price are in the item card.
    if (isTarget) {
        return null
    }

    return (
        <Grid templateColumns={STEP_FIELD_COLUMNS} alignItems="end" gap="3">
            {!isTarget && (
                <BagCountField owned={owned} onChange={handleOwnedChange} />
            )}

            {/* Transfer Crafting is guaranteed to succeed; the main craft's
            is in its card's corner. */}
            {!isTarget && !step.recipe.transfer && (
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
