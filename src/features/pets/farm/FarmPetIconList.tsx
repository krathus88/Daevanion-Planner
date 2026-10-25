import type { FarmSpotPet } from "@pets/logic/farmSpots"
import { FarmPetIconButton } from "./FarmPetIconButton"

type FarmPetIconListProps = {
    pets: FarmSpotPet[]
    onSelect: (petId: number) => void
}

export const FarmPetIconList = ({ pets, onSelect }: FarmPetIconListProps) => {
    return pets.map((entry) => (
        <FarmPetIconButton
            key={entry.pet.id}
            entry={entry}
            onSelect={onSelect}
        />
    ))
}
