import { Flex, Text } from "@chakra-ui/react"
import { WholeNumberInput } from "@common/WholeNumberInput"
import { MAX_AMOUNT } from "@crafting/storage/craftingSettings"
import type { ChangeEvent } from "react"

type SellPriceFieldProps = {
    // Set by hand; null while empty.
    value: number | null
    onChange: (value: number | null) => void
}

// "Sells for [ ] Kinah": the main item's price when the market has none,
// beside the profit it feeds.
export const SellPriceField = ({ value, onChange }: SellPriceFieldProps) => {
    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        const text = event.target.value

        onChange(text === "" ? null : Math.min(MAX_AMOUNT, Number(text)))
    }

    return (
        <Flex alignItems="center" gap="2">
            <Text color="app.muted" fontSize="sm">
                Sells for
            </Text>

            <WholeNumberInput
                w="32"
                size="xs"
                fallback={null}
                value={value ?? ""}
                textAlign="right"
                placeholder="No market price"
                aria-label="Sells for (Kinah)"
                onChange={handleChange}
            />

            <Text color="app.muted" fontSize="sm">
                Kinah
            </Text>
        </Flex>
    )
}
