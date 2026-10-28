import { Flex, Text } from "@chakra-ui/react"
import { SHOP_SOURCE_IDS, type ShopSourceId } from "@pets/logic/shopFilters"
import { ShopSourceToggle } from "./ShopSourceToggle"

type ShopSourceFilterProps = {
    value: ShopSourceId[]
    counts: Record<ShopSourceId, number>
    onChange: (source: ShopSourceId, picked: boolean) => void
}

// Keeps only pets worth buying from any picked source; none picked shows all.
export const ShopSourceFilter = ({
    value,
    counts,
    onChange,
}: ShopSourceFilterProps) => {
    return (
        <Flex flexWrap="wrap" alignItems="center" gap="1.5">
            <Text textStyle="label" mr="1">
                Only worth buying
            </Text>

            <Flex
                flexWrap="wrap"
                gap="1.5"
                role="group"
                aria-label="Only show pets worth buying from these sources"
            >
                {SHOP_SOURCE_IDS.map((source) => (
                    <ShopSourceToggle
                        key={source}
                        source={source}
                        picked={value.includes(source)}
                        count={counts[source]}
                        onChange={onChange}
                    />
                ))}
            </Flex>
        </Flex>
    )
}
