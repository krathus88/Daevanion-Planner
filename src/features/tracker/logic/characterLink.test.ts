import { describe, expect, it } from "vitest"
import { getCharacterLink } from "./characterLink"

const character = (name: string, server: string) => {
    return { id: "a", name: name, classId: "cleric" as const, server: server }
}

describe("getCharacterLink", () => {
    it("opens the character's gear page on its server", () => {
        expect(getCharacterLink(character(" Kryx ", "siel"))).toBe(
            "https://kisk.app/c/eu/siel/Kryx/gear",
        )
    })

    it("escapes the name", () => {
        expect(getCharacterLink(character("A/b c", "ludra"))).toBe(
            "https://kisk.app/c/eu/ludra/A%2Fb%20c/gear",
        )
    })

    it("has no link while the name is empty", () => {
        expect(getCharacterLink(character("  ", "siel"))).toBeNull()
    })
})
