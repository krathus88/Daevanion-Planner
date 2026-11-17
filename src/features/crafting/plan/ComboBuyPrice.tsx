import { Flex, Text } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import type { PriceState } from "@crafting/logic/craftPlan"
import { formatKinah } from "@crafting/logic/formatKinah"
import { MAX_AMOUNT } from "@crafting/storage/craftingSettings"
import type { ChangeEvent } from "react"
import { AmountLoading } from "./AmountLoading"

type ComboBuyPriceProps = {
    state: PriceState
    // Market prices still loading: wait with the rest of the card.
    loading: boolean
    onChange: (price: number | null) => void
}

// What buying the Splendent costs: a merchant's or the market's price with
// where it's from, a placeholder while the market loads, else a field to set
// one.
export const ComboBuyPrice = ({
    state,
    loading,
    onChange,
}: ComboBuyPriceProps) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value

        onChange(text === "" ? null : Math.min(MAX_AMOUNT, Number(text)))
    }

    if (loading || state.kind === "loading") {
        return <AmountLoading w="32" h="6" />
    }

    if (state.kind === "listed") {
        return (
            <Flex alignItems="baseline" gap="2">
                {formatKinah(state.price.value)}

                <Text
                    as="span"
                    color="app.subtle"
                    fontSize="2xs"
                    fontWeight="normal"
                >
                    {state.price.source}
                </Text>
            </Flex>
        )
    }

    return (
        <WholeNumberInput
            w="36"
            size="xs"
            fallback={null}
            value={state.value ?? ""}
            textAlign="right"
            placeholder="Its price"
            aria-label="Splendent price (Kinah)"
            onChange={handleChange}
        />
    )
}
