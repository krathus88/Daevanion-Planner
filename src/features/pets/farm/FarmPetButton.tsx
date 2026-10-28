import { Button, Text } from "@chakra-ui/react"
import { PetIcon } from "@pets/PetIcon"
import type { FarmSpotPet } from "@pets/logic/farmSpots"
import { FarmPetLevelCard } from "./FarmPetLevelCard"

type FarmPetButtonProps = {
    entry: FarmSpotPet
    level: number
    // A focused spot's pets show the level picker on hover too.
    focused: boolean
    onSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

export const FarmPetButton = ({
    entry,
    level,
    focused,
    onSelect,
    onLevelChange,
}: FarmPetButtonProps) => {
    const handleClick = () => {
        onSelect(entry.pet.id)
    }

    // The level card shows the spawns itself, so no title over it.
    return (
        <FarmPetLevelCard
            pet={entry.pet}
            caption={`${entry.spawns} spawns in this spot`}
            level={level}
            hover={focused ? "picker" : "none"}
            onLevelChange={onLevelChange}
        >
            <Button
                variant="secondary"
                size="2xs"
                gap="1.5"
                title={
                    focused ? undefined : `${entry.spawns} spawns in this spot`
                }
                onClick={handleClick}
            >
                <PetIcon pet={entry.pet} size="5" />

                {entry.pet.name}

                <Text as="span" color="app.subtle">
                    {entry.spawns}
                </Text>
            </Button>
        </FarmPetLevelCard>
    )
}
