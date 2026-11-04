import type { TrackerCharacter } from "@tracker/types"

// A name being typed can be empty for a moment.
export const getCharacterName = (character: TrackerCharacter) => {
    return character.name.trim() || "Unnamed"
}
