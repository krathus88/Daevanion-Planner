import { Flex, Grid, Text } from "@chakra-ui/react"
import type { ShopPet } from "@pets/logic/shopCheck"
import { ShopPetTile } from "./ShopPetTile"

type ShopPetGridProps = {
    title: string
    items: ShopPet[]
}

export const ShopPetGrid = ({ title, items }: ShopPetGridProps) => {
    return (
        <Flex flexDir="column" gap="2">
            <Text color="app.muted" fontSize="xs" fontWeight="semibold">
                {title} ({items.length})
            </Text>

            <Grid
                templateColumns="repeat(auto-fill, minmax(9.5rem, 1fr))"
                gap="2"
            >
                {items.map((item) => (
                    <ShopPetTile key={item.pet.id} item={item} />
                ))}
            </Grid>
        </Flex>
    )
}
