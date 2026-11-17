import { Text } from "@chakra-ui/react"
import { formatKinah } from "@crafting/logic/formatKinah"
import { afterTax } from "@crafting/logic/marketTax"
import { getProfitRows } from "@crafting/logic/kinahBreakdown"
import { HoverAmount } from "./HoverAmount"
import { KinahBreakdown } from "./KinahBreakdown"

type PlanCostLineProps = {
    // Expected Kinah for one item, when its craft's materials are priced.
    expectedEach: number | null
    sellPrice: number | null
    // Materials with no price, bag ones included.
    unpriced: number
    // False for Transfer Crafting: no profit, the market doesn't sell it.
    tradable: boolean
}

const plural = (count: number) => {
    return count === 1 ? "material" : "materials"
}

// Under the summary's costs: "Profit +55 Kinah each" (how it adds up on
// hover), or what to price first; nothing without a sell price or for a
// bound item (Transfer Crafting).
export const PlanCostLine = ({
    expectedEach,
    sellPrice,
    unpriced,
    tradable,
}: PlanCostLineProps) => {
    if (expectedEach === null) {
        const toPrice =
            unpriced > 0
                ? `${unpriced} more ${plural(unpriced)}`
                : "every material"

        return (
            <Text textStyle="hint">
                Price {toPrice} to see the cost
                {tradable ? " and profit" : ""}.
            </Text>
        )
    }

    // Bound (Transfer Crafting), or no sell price yet: its field says so.
    if (!tradable || sellPrice === null) {
        return null
    }

    // Sales pay out less the Market tax.
    const profit = afterTax(sellPrice) - expectedEach

    return (
        <Text color="app.muted" fontSize="sm">
            {"Profit "}

            <HoverAmount
                content={
                    <KinahBreakdown
                        rows={getProfitRows(sellPrice, expectedEach)}
                        signed
                        caption="Per item, in Kinah"
                    />
                }
            >
                <Text
                    as="span"
                    color={profit >= 0 ? "app.success" : "app.danger"}
                    fontWeight="semibold"
                >
                    {profit >= 0 ? "+" : ""}
                    {formatKinah(profit)}
                </Text>
            </HoverAmount>

            {" each"}
        </Text>
    )
}
