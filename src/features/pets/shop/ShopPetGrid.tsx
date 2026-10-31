import { Flex, Grid, Text } from "@chakra-ui/react"
import type { ShopPet } from "@pets/logic/shopCheck"
import { ShopPetTile } from "./ShopPetTile"

type ShopPetGridProps = {
    title: string
    items: ShopPet[]
    // Pets flagged as bought, with their souls before.
    bought: Record<string, number>
    onBoughtChange?: (petId: number, bought: boolean) => void
}

export const ShopPetGrid = ({
    title,
    items,
    bought,
    onBoughtChange,
}: ShopPetGridProps) => {
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
                    <ShopPetTile
                        key={item.pet.id}
                        item={item}
                        bought={bought[item.pet.id] !== undefined}
                        onBoughtChange={onBoughtChange}
                    />
                ))}
            </Grid>
        </Flex>
    )
}
