import { Button, Text } from "@chakra-ui/react"
import { PetIcon } from "@pets/PetIcon"
import type { FarmSpotPet } from "@pets/logic/farmSpots"

type FarmPetButtonProps = {
    entry: FarmSpotPet
    onSelect: (petId: number) => void
}

export const FarmPetButton = ({ entry, onSelect }: FarmPetButtonProps) => {
    const handleClick = () => {
        onSelect(entry.pet.id)
    }

    return (
        <Button
            variant="secondary"
            size="2xs"
            gap="1.5"
            title={`${entry.spawns} spawns in this spot`}
            onClick={handleClick}
        >
            <PetIcon pet={entry.pet} size="5" />

            {entry.pet.name}

            <Text as="span" color="app.subtle">
                {entry.spawns}
            </Text>
        </Button>
    )
}
