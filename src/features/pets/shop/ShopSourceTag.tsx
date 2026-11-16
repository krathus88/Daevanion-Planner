import { Text } from "@chakra-ui/react"
import { getShopSourceName, type ShopSourceId } from "@pets/logic/shopFilters"

type ShopSourceTagProps = {
    source: ShopSourceId
}

// Where a pet on sale can be had, as the companion's shop panel tags it.
export const ShopSourceTag = ({ source }: ShopSourceTagProps) => {
    return (
        <Text
            as="span"
            px="1.5"
            bg={`shopTag.${source}`}
            borderRadius="full"
            color="shopTag.ink"
            fontSize="2xs"
            fontWeight="semibold"
            lineHeight="tall"
            whiteSpace="nowrap"
        >
            {getShopSourceName(source)}
        </Text>
    )
}
