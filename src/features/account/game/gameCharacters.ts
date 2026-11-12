import type { ClassId } from "@config/classPresets/classInfo"
import { GAME_CLASSES, getServerId } from "./gameIds"

export type ServerCharacter = {
    name: string
    // Null for class numbers not known yet (see GAME_CLASSES).
    classId: ClassId | null
}

// The companion's characters on a server, from readGameCharacters'
// `<server number>:<class number>:<name>` lines.
export const getServerCharacters = (
    lines: string,
    server: string,
): ServerCharacter[] => {
    const characters: ServerCharacter[] = []

    for (const line of lines.split("\n")) {
        const [serverNumber, classNumber, ...name] = line.split(":")

        if (name.length === 0 || getServerId(Number(serverNumber)) !== server) {
            continue
        }

        characters.push({
            name: name.join(":"),
            classId: GAME_CLASSES[Number(classNumber)] ?? null,
        })
    }

    return characters
}

// A character the companion app sent that the tracker doesn't have.
export type NewGameCharacter = {
    // Its snapshot's key after the prefix: "<server number>:<name>".
    key: string
    name: string
    server: string
    classId: ClassId
}

// The companion's characters the tracker lacks and the user hasn't declined
// (`declined`, see declineGameCharacter), from readGameCharacters' lines. Classes the
// site can't name yet are left out: a character needs one.
export const getNewGameCharacters = (
    lines: string,
    characters: readonly { name: string; server: string }[],
    declined: readonly string[],
): NewGameCharacter[] => {
    const found: NewGameCharacter[] = []

    for (const line of lines.split("\n")) {
        const [serverNumber, classNumber, ...rest] = line.split(":")
        const name = rest.join(":")
        const server = getServerId(Number(serverNumber))
        const classId = GAME_CLASSES[Number(classNumber)]
        const lower = name.toLowerCase()

        if (
            name === "" ||
            server === null ||
            classId === undefined ||
            declined.includes(`${server}:${lower}`) ||
            characters.some((character) => {
                return (
                    character.server === server &&
                    character.name.trim().toLowerCase() === lower
                )
            })
        ) {
            continue
        }

        found.push({
            key: `${serverNumber}:${name}`,
            name: name,
            server: server,
            classId: classId,
        })
    }

    return found
}
