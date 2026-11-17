import { Text } from "@chakra-ui/react"
import { formatKinah } from "@crafting/logic/formatKinah"

type ComboSellAllProps = {
    // Average Kinah per craft, after the Market tax.
    profit: number
}

// "Selling everything you craft: +607,707 Kinah per craft on average."
export const ComboSellAll = ({ profit }: ComboSellAllProps) => {
    return (
        <Text color="app.muted" fontSize="sm">
            {"Selling everything you craft: "}

            <Text
                as="span"
                color={profit >= 0 ? "app.success" : "app.danger"}
                fontWeight="semibold"
            >
                {profit >= 0 ? "+" : ""}
                {formatKinah(profit)}
            </Text>

            {" per craft on average."}
        </Text>
    )
}
