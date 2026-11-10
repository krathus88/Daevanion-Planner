import { Text } from "@chakra-ui/react"
import { MARKET_TAX } from "@crafting/config/market"
import { formatKinah } from "@crafting/logic/formatKinah"
import { afterTax } from "@crafting/logic/marketTax"

type PlanCostLineProps = {
    // Average Kinah to craft one, when every material is priced.
    costEach: number | null
    sellPrice: number | null
    // Materials with no price, bag ones included.
    unpriced: number
    // Missing materials left out of the Kinah to spend.
    unpricedMissing: number
    // False for Transfer Crafting: no profit, the market doesn't sell it.
    tradable: boolean
}

const plural = (count: number) => {
    return count === 1 ? "material" : "materials"
}

// "Cost 125 Kinah each · sells for 200 Kinah · profit +75 Kinah", or what to
// price first.
export const PlanCostLine = ({
    costEach,
    sellPrice,
    unpriced,
    unpricedMissing,
    tradable,
}: PlanCostLineProps) => {
    const leftOut =
        unpricedMissing > 0
            ? ` To spend leaves out ${unpricedMissing} unpriced ${plural(unpricedMissing)}.`
            : ""

    if (costEach === null) {
        return (
            <Text textStyle="hint">
                {unpriced > 0
                    ? `Price ${unpriced} more ${plural(unpriced)} to see the cost each and profit.`
                    : "Price every material to see the cost each and profit."}
                {leftOut}
            </Text>
        )
    }

    // Sales pay out less the Market tax.
    const profit = sellPrice === null ? null : afterTax(sellPrice) - costEach

    return (
        <Text color="app.muted" fontSize="sm">
            Cost{" "}
            <Text as="span" color="app.fg" fontWeight="semibold">
                {formatKinah(costEach)}
            </Text>{" "}
            each
            {!tradable ? (
                " · bound"
            ) : profit === null || sellPrice === null ? (
                " · set Sells for under Main craft to see the profit"
            ) : (
                <>
                    {` · sells for ${formatKinah(sellPrice)}, ${formatKinah(afterTax(sellPrice))} after ${MARKET_TAX}% tax · profit `}
                    <Text
                        as="span"
                        color={profit >= 0 ? "app.success" : "app.danger"}
                        fontWeight="semibold"
                    >
                        {profit >= 0 ? "+" : ""}
                        {formatKinah(profit)}
                    </Text>
                </>
            )}
            {leftOut}
        </Text>
    )
}
