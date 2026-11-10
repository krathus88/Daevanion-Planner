import { chakra, Text } from "@chakra-ui/react"
import type { CraftingItem } from "@crafting/data/craftingData"
import { ItemIcon } from "@crafting/ItemIcon"

type CraftedFromLinkProps = {
    item: CraftingItem
    onSelect: (itemId: number) => void
}

// One item to open: icon and name in its grade's color.
export const CraftedFromLink = ({ item, onSelect }: CraftedFromLinkProps) => {
    const handleClick = () => {
        onSelect(item.id)
    }

    return (
        <chakra.button
            px="1.5"
            py="0.5"
            display="flex"
            alignItems="center"
            gap="1.5"
            borderRadius="sm"
            cursor="button"
            _hover={{ bg: "app.hover" }}
            type="button"
            title={`Open ${item.name}`}
            onClick={handleClick}
        >
            <ItemIcon item={item} size="5" />

            <Text
                color={item.grade ? `grade.${item.grade}` : "app.fg"}
                fontSize="sm"
                fontWeight="semibold"
                textDecoration="underline"
            >
                {item.name}
            </Text>
        </chakra.button>
    )
}
