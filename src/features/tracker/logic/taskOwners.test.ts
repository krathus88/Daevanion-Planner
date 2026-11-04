import { describe, expect, it } from "vitest"
import type { TrackerTask } from "@tracker/types"
import { getServerOwner, getTaskOwner } from "./taskOwners"

const character = {
    id: "a",
    name: "Aria",
    classId: "cleric" as const,
    server: "siel",
}

const task = (shared: boolean): TrackerTask => {
    return { id: "t", name: "T", reset: "daily", cap: 1, shared: shared }
}

describe("getTaskOwner", () => {
    it("is the character for its own tasks", () => {
        expect(getTaskOwner(task(false), character)).toBe("a")
    })

    it("is the character's server for shared tasks", () => {
        expect(getTaskOwner(task(true), character)).toBe(getServerOwner("siel"))
    })
})
