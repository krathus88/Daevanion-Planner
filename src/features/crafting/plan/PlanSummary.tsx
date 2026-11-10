import { Flex, Text } from "@chakra-ui/react"
import type { CraftPlan } from "@crafting/logic/craftPlan"
import { formatCount, formatKinah } from "@crafting/logic/formatKinah"
import { getPlanTotals } from "@crafting/logic/planTotals"
import { AmountLoading } from "./AmountLoading"
import { PlanCostLine } from "./PlanCostLine"

type PlanSummaryProps = {
    plan: CraftPlan
    // Average Kinah to craft one target item, when every material is priced.
    costEach: number | null
    // The same counting only its own craft (bound gear it upgrades as had).
    thisCraftEach: number | null
    // The target's price.
    sellPrice: number | null
    // False for Transfer Crafting: the market doesn't sell it.
    tradable: boolean
    // Market prices still loading: the Kinah would still change.
    pricesLoading: boolean
}

// Kinah to spend first and biggest, then what's missing and how many crafts,
// then one line on cost and profit.
export const PlanSummary = ({
    plan,
    costEach,
    thisCraftEach,
    sellPrice,
    tradable,
    pricesLoading,
}: PlanSummaryProps) => {
    const totals = getPlanTotals(plan)
    const allOwned = totals.missing === 0

    return (
        <Flex
            pt="3"
            flexDir="column"
            gap="1.5"
            borderTopWidth="1px"
            borderColor="app.border"
        >
            <Flex
                flexWrap="wrap"
                alignItems="baseline"
                columnGap="6"
                rowGap="1"
            >
                <Flex alignItems="baseline" gap="2">
                    <Text
                        color="app.fg"
                        fontSize="2xl"
                        fontWeight="bold"
                        lineHeight="short"
                    >
                        {pricesLoading ? (
                            <AmountLoading w="40" h="7" />
                        ) : (
                            formatKinah(totals.spend)
                        )}
                    </Text>

                    <Text textStyle="caption">to spend</Text>
                </Flex>

                <Text
                    color={allOwned ? "app.success" : "app.muted"}
                    fontSize="sm"
                >
                    {allOwned
                        ? "Every material in the bag"
                        : `${totals.missing} of ${plan.materials.length} materials missing`}
                </Text>

                <Text color="app.muted" fontSize="sm">
                    {formatCount(plan.attempts)}{" "}
                    {plan.attempts === 1 ? "craft" : "crafts"}
                </Text>
            </Flex>

            {pricesLoading ? (
                <AmountLoading w="64" />
            ) : (
                <PlanCostLine
                    tradable={tradable}
                    costEach={costEach}
                    thisCraftEach={thisCraftEach}
                    sellPrice={sellPrice}
                    unpriced={totals.unpriced}
                    unpricedMissing={totals.spend === null ? 0 : plan.unpriced}
                />
            )}
        </Flex>
    )
}
