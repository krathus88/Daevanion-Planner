import { describe, expect, it } from "vitest"
import {
    findPlayingId,
    getPlayingCharacter,
    getPlayingClass,
} from "./playingCharacter"

const running = (name: string, server: number) => {
    return {
        state: "running" as const,
        character: { name: name, server: server, class: 30 },
    }
}

const CHARACTERS = [
    { id: "a", name: "Kept", server: "siel" },
    { id: "b", name: "kept", server: "nezekan" },
]

describe("getPlayingCharacter", () => {
    it("names the server by its id", () => {
        expect(getPlayingCharacter(running("Kept", 1302))).toEqual({
            name: "Kept",
            server: "nezekan",
        })
    })

    it("is null while stopped or before a character", () => {
        expect(getPlayingCharacter({ state: "stopped" })).toBeNull()
        expect(
            getPlayingCharacter({ state: "running", character: null }),
        ).toBeNull()
        expect(getPlayingCharacter(running("Kept", 9999))).toBeNull()
    })
})

describe("findPlayingId", () => {
    it("matches the name in any case on the same server", () => {
        expect(findPlayingId(running("KEPT", 1301), CHARACTERS)).toBe("a")
        expect(findPlayingId(running("Kept", 1302), CHARACTERS)).toBe("b")
    })

    it("finds nothing for other characters", () => {
        expect(
            findPlayingId(running("Other", 1301), CHARACTERS),
        ).toBeUndefined()
        expect(findPlayingId({ state: "unknown" }, CHARACTERS)).toBeUndefined()
    })
})

describe("getPlayingClass", () => {
    it("names the played character's class, with who it is", () => {
        expect(
            getPlayingClass({
                state: "running",
                character: { name: "Kryx", server: 1301, class: 30 },
            }),
        ).toEqual({ who: "1301:Kryx", classId: "cleric" })
    })

    it("is null without a played character or a known class", () => {
        expect(getPlayingClass({ state: "stopped" })).toBeNull()
        expect(
            getPlayingClass({ state: "running", character: null }),
        ).toBeNull()
        expect(
            getPlayingClass({
                state: "running",
                character: { name: "Kryx", server: 1301, class: 99 },
            }),
        ).toBeNull()
    })
})
