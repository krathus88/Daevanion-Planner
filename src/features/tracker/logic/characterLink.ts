import type { TrackerCharacter } from "@tracker/types"

// The character's gear page on kisk.app (EU servers only, like the tracker),
// or null while it has no name.
export const getCharacterLink = (character: TrackerCharacter) => {
    const name = character.name.trim()

    if (!name) {
        return null
    }

    return `https://kisk.app/c/eu/${character.server}/${encodeURIComponent(name)}/gear`
}
