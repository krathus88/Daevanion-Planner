import type { Pet, PetAtlas } from "@pets/data/petAtlas"
import { getPetLevel } from "@pets/logic/petLevels"
import { PetListItem } from "./PetListItem"

type PetListProps = {
    atlas: PetAtlas
    pets: Pet[]
    levels: Record<string, number>
    selectedPetId?: number
    onSelect: (petId: number) => void
    onLevelChange: (petId: number, level: number) => void
}

export const PetList = ({
    atlas,
    pets,
    levels,
    selectedPetId,
    onSelect,
    onLevelChange,
}: PetListProps) => {
    return pets.map((pet) => (
        <PetListItem
            key={pet.id}
            atlas={atlas}
            pet={pet}
            level={getPetLevel(levels, pet.id)}
            selected={pet.id === selectedPetId}
            onSelect={onSelect}
            onLevelChange={onLevelChange}
        />
    ))
}
