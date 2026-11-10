import { Flex, Text } from "@chakra-ui/react"
import type { CraftingItem } from "@crafting/data/craftingData"
import { CraftedFromLink } from "./CraftedFromLink"

type CraftedFromLinksProps = {
    items: CraftingItem[]
    onSelect: (itemId: number) => void
}

// "Crafted from True Dragon Lord Ring": the gear one tier down, each opening
// its own craft.
export const CraftedFromLinks = ({
    items,
    onSelect,
}: CraftedFromLinksProps) => {
    if (items.length === 0) {
        return null
    }

    return (
        <Flex flexWrap="wrap" alignItems="center" columnGap="3" rowGap="1">
            <Text textStyle="caption">Crafted from</Text>

            {items.map((item) => (
                <CraftedFromLink
                    key={item.id}
                    item={item}
                    onSelect={onSelect}
                />
            ))}
        </Flex>
    )
}
