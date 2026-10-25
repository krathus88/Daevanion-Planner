import type { FarmSpotPet } from "@pets/logic/farmSpots"
import { FarmPetButton } from "./FarmPetButton"

type FarmPetListProps = {
    pets: FarmSpotPet[]
    onSelect: (petId: number) => void
}

export const FarmPetList = ({ pets, onSelect }: FarmPetListProps) => {
    return pets.map((entry) => (
        <FarmPetButton key={entry.pet.id} entry={entry} onSelect={onSelect} />
    ))
}
