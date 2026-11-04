import { describe, expect, it } from "vitest"
import { getCharacterName } from "./characterName"

const character = (name: string) => {
    return { id: "a", name: name, classId: "cleric" as const, server: "siel" }
}

describe("getCharacterName", () => {
    it("shows the name, trimmed", () => {
        expect(getCharacterName(character(" Aria "))).toBe("Aria")
    })

    it("falls back while the name is empty", () => {
        expect(getCharacterName(character("  "))).toBe("Unnamed")
    })
})
