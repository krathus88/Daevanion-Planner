import { Flex, Image, Text } from "@chakra-ui/react"
import { ImportLevelLabel } from "@pets/importer/ImportLevelLabel"
import type { ShopPet } from "@pets/logic/shopCheck"
import { PetIcon } from "@pets/PetIcon"

type ShopPetTileProps = {
    item: ShopPet
}

// The art as read next to the pet it matched, so a wrong match is easy to
// spot.
export const ShopPetTile = ({ item }: ShopPetTileProps) => {
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
                    <ImportLevelLabel level={item.level} />
                </Flex>
            </Flex>
        </Flex>
    )
}
