import { Flex, Text } from "@chakra-ui/react"
import { describeComboVerdict } from "@crafting/logic/comboLabels"
import type { ComboValue } from "@crafting/logic/comboValue"
import type { PriceState } from "@crafting/logic/craftPlan"
import { formatKinah } from "@crafting/logic/formatKinah"
import { getCraftItRows } from "@crafting/logic/kinahBreakdown"
import { AmountLoading } from "./AmountLoading"
import { ComboBuyPrice } from "./ComboBuyPrice"
import { ComboCostRow } from "./ComboCostRow"
import { HoverAmount } from "./HoverAmount"
import { KinahBreakdown } from "./KinahBreakdown"

type ComboVerdictProps = {
    value: ComboValue
    // The Splendent's price: listed, loading or set by hand.
    priceState: PriceState
    // Market prices still loading: every Kinah here may still change.
    pricesLoading: boolean
    onPriceChange: (price: number | null) => void
}

// To get one Splendent: crafting it (how that adds up on hover) against
// buying one
// (its price, or a field for it), and which is cheaper.
export const ComboVerdict = ({
    value,
    priceState,
    pricesLoading,
    onPriceChange,
}: ComboVerdictProps) => {
    const crafting = value.netCostPerProc ?? value.costPerProc
    const rows = getCraftItRows(value)
    const verdict = describeComboVerdict(crafting, value.splendentPrice)
    // How it adds up on hover, once priced.
    const craftAmount =
        rows.length === 0 ? (
            formatKinah(crafting)
        ) : (
            <HoverAmount
                content={
                    <KinahBreakdown
                        rows={rows}
                        caption="Per Splendent, in Kinah"
                    />
                }
            >
                {formatKinah(crafting)}
            </HoverAmount>
        )

    return (
        <Flex minW="0" flexDir="column" gap="2">
            <Text textStyle="label">To get one Splendent</Text>

            <ComboCostRow
                amount={
                    pricesLoading ? <AmountLoading w="32" h="6" /> : craftAmount
                }
                label="Craft it"
            />

            {/* Bound items aren't on the market. */}
            {value.splendentTradable && (
                <ComboCostRow
                    amount={
                        <ComboBuyPrice
                            state={priceState}
                            loading={pricesLoading}
                            onChange={onPriceChange}
                        />
                    }
                    label="Buy it"
                />
            )}

            {verdict && !pricesLoading && (
                <Text
                    color={
                        verdict.cheaperToCraft ? "app.success" : "app.danger"
                    }
                    fontSize="sm"
                    fontWeight="semibold"
                >
                    → {verdict.text}
                </Text>
            )}
        </Flex>
    )
}
