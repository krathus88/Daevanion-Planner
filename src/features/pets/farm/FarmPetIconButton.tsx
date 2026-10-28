import { chakra } from "@chakra-ui/react"
import { PetIcon } from "@pets/PetIcon"
import type { FarmSpotPet } from "@pets/logic/farmSpots"
import { FarmPetLevelCard } from "./FarmPetLevelCard"

type FarmPetIconButtonProps = {
    entry: FarmSpotPet
    level: number
    // A focused spot's pets show the level picker on hover too.
    focused: boolean
    onSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

// A spot's pet as just its portrait, for the minimized panel. Hovering an
// unfocused spot's pet names it, like a tooltip.
export const FarmPetIconButton = ({
    entry,
    level,
    focused,
    onSelect,
    onLevelChange,
}: FarmPetIconButtonProps) => {
    const handleClick = () => {
        onSelect(entry.pet.id)
    }

    return (
        <FarmPetLevelCard
            pet={entry.pet}
            caption={`${entry.spawns} spawns in this spot`}
            level={level}
            hover={focused ? "picker" : "info"}
            onLevelChange={onLevelChange}
        >
            <chakra.button
                flexShrink="0"
                borderRadius="md"
                cursor="button"
                _hover={{ outline: "1px solid", outlineColor: "app.accent" }}
                type="button"
                aria-label={entry.pet.name}
                onClick={handleClick}
            >
                <PetIcon pet={entry.pet} size="8" />
            </chakra.button>
        </FarmPetLevelCard>
    )
}
