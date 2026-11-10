import { Text } from "@chakra-ui/react"
import { MARKET_TAX } from "@crafting/config/market"
import { formatCount, formatKinah } from "@crafting/logic/formatKinah"
import { afterTax } from "@crafting/logic/marketTax"

type PlanCostLineProps = {
    // Average Kinah to craft one from the start of the chain, when every
    // material is priced.
    costEach: number | null
    // The same for its own craft only (bound gear it upgrades as had).
    thisCraftEach: number | null
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

const Amount = ({ value }: { value: number }) => {
    return (
        <Text as="span" color="app.fg" fontWeight="semibold">
            {formatKinah(value)}
        </Text>
    )
}

// "Cost 125 Kinah each · sells for 200 Kinah · profit +75 Kinah", or what to
// price first; "Whole chain … · this craft only …" when its own craft costs
// something else.
export const PlanCostLine = ({
    costEach,
    thisCraftEach,
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
        const toPrice =
            unpriced > 0
                ? `${unpriced} more ${plural(unpriced)}`
                : "every material"

        if (thisCraftEach !== null) {
            return (
                <Text color="app.muted" fontSize="sm">
                    This craft only <Amount value={thisCraftEach} /> each ·
                    price {toPrice} to see the whole chain&apos;s cost
                    {tradable ? " and profit" : ""}.{leftOut}
                </Text>
            )
        }

        return (
            <Text textStyle="hint">
                Price {toPrice} to see the cost each
                {tradable ? " and profit" : ""}.{leftOut}
            </Text>
        )
    }

    // Shown only when it differs from the whole chain's.
    const thisCraft =
        thisCraftEach !== null &&
        Math.round(thisCraftEach) !== Math.round(costEach)
            ? thisCraftEach
            : null

    // Sales pay out less the Market tax.
    const profit = sellPrice === null ? null : afterTax(sellPrice) - costEach

    return (
        <Text color="app.muted" fontSize="sm">
            {thisCraft === null ? "Cost" : "Whole chain"}{" "}
            <Amount value={costEach} /> each
            {thisCraft !== null && (
                <>
                    {" · this craft only "}
                    <Amount value={thisCraft} />
                </>
            )}
            {!tradable ? (
                " · bound"
            ) : profit === null || sellPrice === null ? (
                " · set Sells for under Main craft to see the profit"
            ) : (
                <>
                    {` · sells for ${formatKinah(sellPrice)} (${formatCount(Math.round(afterTax(sellPrice)))} after ${MARKET_TAX}% tax) · profit `}
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
