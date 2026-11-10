import { Box, Image } from "@chakra-ui/react"
import { getCraftingIconUrl } from "@assets/crafting"
import type { CraftingItem } from "@crafting/data/craftingData"

type ItemIconProps = {
    item: CraftingItem
    size?: "5" | "7" | "10"
}

export const ItemIcon = ({ item, size = "7" }: ItemIconProps) => {
    const url = getCraftingIconUrl(item.id)

    if (!url) {
        return (
            <Box
                boxSize={size}
                flexShrink="0"
                bg="app.inset"
                borderColor="app.border"
                borderWidth="1px"
                borderRadius="sm"
            />
        )
    }

    return (
        <Image
            src={url}
            boxSize={size}
            flexShrink="0"
            borderRadius="sm"
            alt=""
            loading="lazy"
        />
    )
}
