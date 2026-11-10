import { describe, expect, it } from "vitest"
import { parseTrackerData } from "@tracker/storage/trackerData"
import { FIRST_PRESETS, STARTER_TASKS, STARTS_IGNORED } from "./starterTasks"
import { getTaskIcon, getTaskIconGlow } from "./taskIcons"

describe("STARTER_TASKS", () => {
    it("has unique ids", () => {
        const ids = STARTER_TASKS.map((task) => task.id)

        expect(new Set(ids).size).toBe(ids.length)
    })

    it("still has every task older saves knew, Invasion, Arena 1v1 and Corridors coming after", () => {
        const ids = STARTER_TASKS.map((task) => task.id)

        expect(ids.filter((id) => !FIRST_PRESETS.includes(id))).toEqual([
            "invasion",
            "arena-1v1-wins",
            "arena-1v1-participation",
            "corridors",
        ])
        expect(FIRST_PRESETS.every((id) => ids.includes(id))).toBe(true)
    })

    it("would survive a save as the user's own list", () => {
        expect(parseTrackerData({ tasks: STARTER_TASKS }).tasks).toEqual(
            STARTER_TASKS,
        )
    })

    it("lists a character's weeklies as Odyle, Ludra, Ascension Trial, Arena, Battlefield", () => {
        const weekly = STARTER_TASKS.filter((task) => {
            return task.reset === "weekly" && !task.shared
        })

        expect(weekly.map((task) => task.id)).toEqual([
            "odyle-craft",
            "odyle-shop",
            "ludra",
            "ascension-trial",
            "arena-wins",
            "arena-participation",
            "arena-1v1-wins",
            "arena-1v1-participation",
            "battlefield-wins",
            "battlefield-participation",
        ])
    })

    it("has Arena 5v5 and 1v1 with the same caps, 1v1 starting ignored", () => {
        const arena = STARTER_TASKS.filter((task) => {
            return task.name.startsWith("Arena")
        })

        expect(
            arena.map((task) => [task.name, task.subtitle, task.cap]),
        ).toEqual([
            ["Arena 5v5", "Wins", 30],
            ["Arena 5v5", "Participation", 10],
            ["Arena 1v1", "Wins", 30],
            ["Arena 1v1", "Participation", 10],
        ])
        expect(STARTS_IGNORED).toEqual([
            "arena-1v1-wins",
            "arena-1v1-participation",
        ])
    })

    it("tracks the Daily Dungeon per server as entries left, refilled weekly", () => {
        expect(
            STARTER_TASKS.find((task) => task.id === "unknown-fissure"),
        ).toMatchObject({
            reset: "weekly",
            shared: true,
            cap: 14,
            recharge: 14,
            bonusCap: 30,
        })
    })

    it("tracks Nightmare per character as entries left", () => {
        expect(
            STARTER_TASKS.find((task) => task.id === "nightmare"),
        ).toMatchObject({ shared: false, cap: 14, recharge: 2, bonusCap: 30 })
    })

    it("tracks Ascension Trial per character as entries left, refilled weekly", () => {
        expect(
            STARTER_TASKS.find((task) => task.id === "ascension-trial"),
        ).toMatchObject({
            reset: "weekly",
            shared: false,
            cap: 3,
            recharge: 3,
            bonusCap: 30,
        })
    })

    it("tracks Shugo Festival keys per server, piling up to 21", () => {
        expect(
            STARTER_TASKS.find((task) => task.id === "shugo-festival"),
        ).toMatchObject({
            reset: "daily",
            shared: true,
            cap: 21,
            recharge: 3,
            bonusCap: 30,
        })
    })

    it("tracks Invasion per server as entries, 1 a day piling up to 7", () => {
        expect(
            STARTER_TASKS.find((task) => task.id === "invasion"),
        ).toMatchObject({
            reset: "daily",
            shared: true,
            cap: 7,
            recharge: 1,
            bonusCap: 0,
        })
    })

    it("tracks Corridors once per character each Artifact Siege", () => {
        expect(
            STARTER_TASKS.find((task) => task.id === "corridors"),
        ).toMatchObject({
            name: "Corridors",
            subtitle: "Artifact Siege",
            reset: "siege",
            shared: false,
            cap: 1,
        })
    })

    it("counts the weekly Commands per server", () => {
        const commands = STARTER_TASKS.filter((task) => {
            return task.name === "Command"
        })

        expect(
            commands.map((task) => [task.subtitle, task.cap, task.shared]),
        ).toEqual([
            ["Faction", 12, true],
            ["Abyss", 20, true],
        ])
    })
})

describe("getTaskIcon", () => {
    it("has an icon for every starter task and none for the user's", () => {
        for (const task of STARTER_TASKS) {
            expect(getTaskIcon(task.id)).toBeTruthy()
        }

        expect(getTaskIcon("my-own-task")).toBeUndefined()
    })
})

describe("getTaskIconGlow", () => {
    it("glows Nightmare blue and Ascension Trial red, nothing else", () => {
        expect(getTaskIconGlow("nightmare")).toBe("blue.400")
        expect(getTaskIconGlow("ascension-trial")).toBe("red.500")

        const others = STARTER_TASKS.filter((task) => {
            return task.id !== "nightmare" && task.id !== "ascension-trial"
        })

        for (const task of others) {
            expect(getTaskIconGlow(task.id)).toBeUndefined()
        }
    })
})
