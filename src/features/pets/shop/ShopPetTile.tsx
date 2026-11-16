import { Flex, Image, Text } from "@chakra-ui/react"
import { ImportLevelLabel } from "@pets/importer/ImportLevelLabel"
import type { ShopPet } from "@pets/logic/shopCheck"
import type { ShopSourceId } from "@pets/logic/shopFilters"
import { PetIcon } from "@pets/PetIcon"
import { ShopBoughtToggle } from "./ShopBoughtToggle"
import { ShopSourceTag } from "./ShopSourceTag"

type ShopPetTileProps = {
    item: ShopPet
    // Where it can be had, as tags.
    sources: ShopSourceId[]
    bought: boolean
    // Left out for pets that can't take more souls.
    onBoughtChange?: (petId: number, bought: boolean) => void
}

// The art as read next to the pet it matched, so a wrong match is easy to
// spot.
export const ShopPetTile = ({
    item,
    sources,
    bought,
    onBoughtChange,
}: ShopPetTileProps) => {
    return (
        <Flex
            p="2"
            minW="0"
            flexDir="column"
            gap="1.5"
            layerStyle="listItem"
            bg="app.row"
        >
            <Flex alignItems="center" gap="1.5">
                <Image
                    src={item.thumbnail}
                    boxSize="10"
                    flexShrink="0"
                    objectFit="cover"
                    borderRadius="md"
                    alt=""
                    aria-hidden="true"
                />

                <PetIcon pet={item.pet} />
            </Flex>

            <Flex minW="0" flexDir="column" gap="1">
                <Text fontSize="sm" fontWeight="medium" truncate>
                    {item.pet.name}
                </Text>

                <Flex>
                    <ImportLevelLabel level={item.level} souls={item.souls} />
                </Flex>

                <Flex flexWrap="wrap" gap="1">
                    {sources.map((source) => (
                        <ShopSourceTag key={source} source={source} />
                    ))}
                </Flex>

                {onBoughtChange && (
                    <ShopBoughtToggle
                        petId={item.pet.id}
                        checked={bought}
                        onChange={onBoughtChange}
                    />
                )}
            </Flex>
        </Flex>
    )
}
