import type { FarmSpotPet } from "@pets/logic/farmSpots"
import { getPetLevel } from "@pets/logic/petLevels"
import { FarmPetIconButton } from "./FarmPetIconButton"

type FarmPetIconListProps = {
    pets: FarmSpotPet[]
    levels: Record<string, number>
    focused: boolean
    onSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

export const FarmPetIconList = ({
    pets,
    levels,
    focused,
    onSelect,
    onLevelChange,
}: FarmPetIconListProps) => {
    return pets.map((entry) => (
        <FarmPetIconButton
            key={entry.pet.id}
            entry={entry}
            level={getPetLevel(levels, entry.pet.id)}
            focused={focused}
            onSelect={onSelect}
            onLevelChange={onLevelChange}
        />
    ))
}
