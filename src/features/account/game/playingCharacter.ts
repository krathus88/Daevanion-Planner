import type { CompanionStatus } from "./companionStatus"
import { GAME_CLASSES, getServerId } from "./gameIds"

type NamedCharacter = {
    id: string
    name: string
    server: string
}

// The character the companion app sees being played, as the site names it:
// its name and server id. Null when it isn't running or hasn't seen one.
export const getPlayingCharacter = (status: CompanionStatus) => {
    if (status.state !== "running" || status.character === null) {
        return null
    }

    const server = getServerId(status.character.server)

    return server === null
        ? null
        : { name: status.character.name, server: server }
}

// The id of the tracker's character being played, matched like snapshots
// are: same name (any case) on the same server.
export const findPlayingId = (
    status: CompanionStatus,
    characters: readonly NamedCharacter[],
) => {
    const playing = getPlayingCharacter(status)

    if (playing === null) {
        return undefined
    }

    const name = playing.name.toLowerCase()
    const found = characters.find((character) => {
        return (
            character.server === playing.server &&
            character.name.trim().toLowerCase() === name
        )
    })

    return found?.id
}

// The class of the character being played, with who it is (so a switch to
// another character of the same class still counts as a change). Null when
// none is played or its class number isn't known yet.
export const getPlayingClass = (status: CompanionStatus) => {
    if (status.state !== "running" || status.character === null) {
        return null
    }

    const classId = GAME_CLASSES[status.character.class]

    return classId === undefined
        ? null
        : {
              who: `${status.character.server}:${status.character.name}`,
              classId: classId,
          }
}
