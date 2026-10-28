import type { FarmSpotPet } from "@pets/logic/farmSpots"
import { getPetLevel } from "@pets/logic/petLevels"
import { FarmPetButton } from "./FarmPetButton"

type FarmPetListProps = {
    pets: FarmSpotPet[]
    levels: Record<string, number>
    focused: boolean
    onSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

export const FarmPetList = ({
    pets,
    levels,
    focused,
    onSelect,
    onLevelChange,
}: FarmPetListProps) => {
    return pets.map((entry) => (
        <FarmPetButton
            key={entry.pet.id}
            entry={entry}
            level={getPetLevel(levels, entry.pet.id)}
            focused={focused}
            onSelect={onSelect}
            onLevelChange={onLevelChange}
        />
    ))
}
