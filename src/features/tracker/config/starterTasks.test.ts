import { describe, expect, it } from "vitest"
import { parseTrackerData } from "@tracker/storage/trackerData"
import { FIRST_PRESETS, STARTER_TASKS } from "./starterTasks"
import { getTaskIcon } from "./taskIcons"

describe("STARTER_TASKS", () => {
    it("has unique ids", () => {
        const ids = STARTER_TASKS.map((task) => task.id)

        expect(new Set(ids).size).toBe(ids.length)
    })

    it("still has every task older saves knew, Corridors coming after", () => {
        const ids = STARTER_TASKS.map((task) => task.id)

        expect(ids.filter((id) => !FIRST_PRESETS.includes(id))).toEqual([
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
            "battlefield-wins",
            "battlefield-participation",
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
