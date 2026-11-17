import { Flex, Text } from "@chakra-ui/react"
import type { CraftPlan, PriceState } from "@crafting/logic/craftPlan"
import type { FinishChance } from "@crafting/logic/craftOdds"
import { getExpectedRows, getToBuyRows } from "@crafting/logic/kinahBreakdown"
import { getPlanTotals } from "@crafting/logic/planTotals"
import { AmountLoading } from "./AmountLoading"
import { FinishOdds } from "./FinishOdds"
import { KinahBreakdown } from "./KinahBreakdown"
import { PlanAmount } from "./PlanAmount"
import { PlanCostLine } from "./PlanCostLine"
import { SellPriceField } from "./SellPriceField"

type PlanSummaryProps = {
    plan: CraftPlan
    // Kinah one craft of the target uses, when its materials are priced.
    attemptCost: number | null
    // Crafts it takes on average to make one target item.
    craftsEach: number
    // How sure the crafts it takes, and a couple more, are.
    finishes: FinishChance[]
    // Why the chances may be off, or null.
    oddsHint: string | null
    // Why the game won't let you craft it yet, shown instead of the
    // chances and what they give; null when it will.
    blocked: string | null
    // How many to make.
    count: number
    // The target's price.
    sellPrice: number | null
    // Its price spot: a field beside the profit only when it's "own" (no
    // merchant or market price).
    sellPriceState: PriceState
    // False for Transfer Crafting: the market doesn't sell it.
    tradable: boolean
    // Market prices still loading: the Kinah would still change.
    pricesLoading: boolean
    onSellPriceChange: (value: number | null) => void
}

// One craft's cost (no bag) and what's still to buy (after the bag) big,
// the profit under them, and how sure the crafts are beside them with the
// expected cost on hover (user-asked); while the game won't let you craft
// it, no chances or profit, and why.
export const PlanSummary = ({
    plan,
    attemptCost,
    craftsEach,
    finishes,
    oddsHint,
    blocked,
    count,
    sellPrice,
    sellPriceState,
    tradable,
    pricesLoading,
    onSellPriceChange,
}: PlanSummaryProps) => {
    const totals = getPlanTotals(plan)
    const expectedEach = attemptCost === null ? null : attemptCost * craftsEach
    const toBuyRows = getToBuyRows(plan)
    const leftOut =
        plan.unpriced > 0 ? `, leaving out ${plan.unpriced} unpriced` : ""
    const toBuyHover =
        toBuyRows.length === 0 ? undefined : (
            <KinahBreakdown
                rows={toBuyRows}
                caption={`Missing after your bag${leftOut}, in Kinah`}
            />
        )
    const expectedHover =
        attemptCost === null ? undefined : (
            <KinahBreakdown
                rows={getExpectedRows(attemptCost, craftsEach, count)}
                caption="With failures, before your bag, in Kinah"
            />
        )

    return (
        <Flex
            pt="3"
            flexDir="column"
            gap="2"
            borderTopWidth="1px"
            borderColor="app.border"
        >
            <Flex
                flexWrap="wrap"
                alignItems="center"
                justifyContent="space-between"
                columnGap="6"
                rowGap="3"
            >
                <Flex minW="0" flexDir="column" gap="1">
                    <Flex
                        flexWrap="wrap"
                        alignItems="baseline"
                        columnGap="6"
                        rowGap="1"
                    >
                        <PlanAmount
                            value={attemptCost}
                            loading={pricesLoading}
                            caption="per craft"
                        />

                        <PlanAmount
                            value={totals.spend}
                            loading={pricesLoading}
                            caption="to buy, after your bag"
                            hover={toBuyHover}
                        />
                    </Flex>

                    {blocked !== null && (
                        <Text color="app.warning" fontSize="sm">
                            {blocked}
                        </Text>
                    )}

                    {/* A bound item has no sale or profit to wait for. */}
                    {blocked === null && pricesLoading && tradable && (
                        <AmountLoading w="40" />
                    )}

                    {blocked === null && !pricesLoading && (
                        <Flex
                            flexWrap="wrap"
                            alignItems="center"
                            columnGap="4"
                            rowGap="1"
                        >
                            {tradable && sellPriceState.kind === "own" && (
                                <SellPriceField
                                    value={sellPriceState.value}
                                    onChange={onSellPriceChange}
                                />
                            )}

                            <PlanCostLine
                                expectedEach={expectedEach}
                                sellPrice={sellPrice}
                                unpriced={totals.unpriced}
                                tradable={tradable}
                            />
                        </Flex>
                    )}
                </Flex>

                {blocked === null && (
                    <FinishOdds finishes={finishes} hover={expectedHover} />
                )}
            </Flex>

            {blocked === null && oddsHint !== null && (
                <Text textStyle="hint">{oddsHint}</Text>
            )}
        </Flex>
    )
}
