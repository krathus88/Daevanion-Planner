import { Flex, Image } from "@chakra-ui/react"
import { getPetIconUrl } from "@assets/pets"
import type { Pet } from "@pets/data/petAtlas"
import { CategoryDot } from "./CategoryDot"

type PetIconProps = {
    pet: Pet
    size?: "5" | "8" | "10" | "14"
}

// The pet's portrait on a tile, or its type dot when it has none.
export const PetIcon = ({ pet, size = "10" }: PetIconProps) => {
    const url = getPetIconUrl(pet.icon)

    return (
        <Flex
            boxSize={size}
            flexShrink="0"
            alignItems="center"
            justifyContent="center"
            overflow="hidden"
            bg="app.inset"
            borderRadius={size === "5" ? "sm" : "md"}
        >
            {url ? (
                <Image
                    src={url}
                    boxSize="full"
                    objectFit="contain"
                    loading="lazy"
                    alt=""
                    aria-hidden="true"
                />
            ) : (
                <CategoryDot category={pet.category} />
            )}
        </Flex>
    )
}
