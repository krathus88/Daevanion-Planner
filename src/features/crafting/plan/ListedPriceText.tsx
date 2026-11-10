import { Flex, Text, type FlexProps } from "@chakra-ui/react"
import type { ListedPrice } from "@crafting/logic/craftPlan"
import { formatCount } from "@crafting/logic/formatKinah"

type ListedPriceTextProps = FlexProps & {
    price: ListedPrice
    // A field's label, above the price (for labelled fields).
    label?: string
}

const SOURCE_TITLES = {
    merchant: "Fixed price at the game's merchants",
    market: "Market price from Aion2Market",
}

// A merchant's or the market's price, read-only: it's the real price, so it
// takes the place of a price field, with where it's from under it.
export const ListedPriceText = ({
    price,
    label,
    ...props
}: ListedPriceTextProps) => {
    return (
        <Flex
            flexDir="column"
            alignItems={label ? "flex-start" : "flex-end"}
            gap="0.5"
            title={SOURCE_TITLES[price.source]}
            {...props}
        >
            {label && <Text textStyle="caption">{label}</Text>}

            <Text color="app.fg" fontSize="sm" lineHeight="short">
                {formatCount(price.value)}
            </Text>

            <Text color="app.subtle" fontSize="2xs" lineHeight="short">
                {price.source}
            </Text>
        </Flex>
    )
}
