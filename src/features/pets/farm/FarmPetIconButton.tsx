import { chakra } from "@chakra-ui/react"
import { PetIcon } from "@pets/PetIcon"
import type { FarmSpotPet } from "@pets/logic/farmSpots"
import { Tooltip } from "@ui/tooltip"

type FarmPetIconButtonProps = {
    entry: FarmSpotPet
    onSelect: (petId: number) => void
}

// A spot's pet as just its portrait, for the minimized panel.
export const FarmPetIconButton = ({
    entry,
    onSelect,
}: FarmPetIconButtonProps) => {
    const handleClick = () => {
        onSelect(entry.pet.id)
    }

    return (
        <Tooltip
            content={`${entry.pet.name} · ${entry.spawns} spawns`}
            openDelay={100}
            showArrow
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
        </Tooltip>
    )
}
