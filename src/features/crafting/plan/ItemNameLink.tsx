import { chakra } from "@chakra-ui/react"
import type { CraftingItem } from "@crafting/data/craftingData"
import { ItemName } from "@crafting/ItemName"
import type { ReactNode } from "react"

type ItemNameLinkProps = {
    item: CraftingItem
    caption?: ReactNode
    onSelect: (itemId: number) => void
}

// An item's icon and name that opens its own craft.
export const ItemNameLink = ({
    item,
    caption,
    onSelect,
}: ItemNameLinkProps) => {
    const handleClick = () => {
        onSelect(item.id)
    }

    return (
        <chakra.button
            minW="0"
            display="flex"
            textAlign="left"
            cursor="button"
            _hover={{ textDecoration: "underline" }}
            type="button"
            title={`Open ${item.name}`}
            onClick={handleClick}
        >
            <ItemName item={item} wrap caption={caption} />
        </chakra.button>
    )
}
