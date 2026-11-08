import { describe, expect, it } from "vitest"
import { STARTER_TASKS } from "@tracker/config/starterTasks"
import type { TrackerTask } from "@tracker/types"
import {
    addIgnored,
    addNewPresets,
    getNewIgnoredPresets,
    insertPreset,
    renameOldPresets,
    STARTER_IDS,
} from "./presetTasks"

const own: TrackerTask = {
    id: "own",
    name: "Own",
    reset: "daily",
    cap: 1,
    shared: false,
}

const getStarter = (id: string) => {
    const task = STARTER_TASKS.find((item) => item.id === id)

    if (!task) {
        throw new Error(`No starter task ${id}`)
    }

    return task
}

describe("insertPreset", () => {
    it("goes before the next starter task still in the list", () => {
        const tasks = [own, getStarter("duty-missions")]

        expect(
            insertPreset(tasks, getStarter("nightmare")).map((task) => task.id),
        ).toEqual(["own", "nightmare", "duty-missions"])
    })

    it("goes last when no later starter task is left", () => {
        expect(
            insertPreset([own], getStarter("corridors")).map((task) => task.id),
        ).toEqual(["own", "corridors"])
    })

    it("leaves a list that has it as is", () => {
        const tasks = [getStarter("corridors")]

        expect(insertPreset(tasks, getStarter("corridors"))).toBe(tasks)
    })
})

describe("addNewPresets", () => {
    it("adds only starter tasks the list didn't know of", () => {
        const known = STARTER_IDS.filter((id) => id !== "corridors")

        expect(addNewPresets([own], known).map((task) => task.id)).toEqual([
            "own",
            "corridors",
        ])
    })

    it("keeps a known starter task removed", () => {
        expect(addNewPresets([own], STARTER_IDS)).toEqual([own])
    })
})

describe("addIgnored", () => {
    it("adds the tasks to each owner, without repeats", () => {
        expect(addIgnored({ a: ["x", "y"] }, ["a", "b"], ["y", "z"])).toEqual({
            a: ["x", "y", "z"],
            b: ["y", "z"],
        })
    })

    it("leaves the list as is with no tasks", () => {
        const ignored = { a: ["x"] }

        expect(addIgnored(ignored, ["a", "b"], [])).toBe(ignored)
    })
})

describe("getNewIgnoredPresets", () => {
    it("lists the ones that start ignored and the save didn't know", () => {
        expect(getNewIgnoredPresets(["arena-1v1-wins"])).toEqual([
            "arena-1v1-participation",
        ])
        expect(getNewIgnoredPresets(STARTER_IDS)).toEqual([])
    })
})

describe("renameOldPresets", () => {
    const arena = { ...own, id: "arena-wins", name: "Arena" }

    it("calls the old Arena tasks Arena 5v5, keeping renamed ones", () => {
        const renamed = { ...arena, id: "arena-participation", name: "PvP" }

        expect(
            renameOldPresets([arena, renamed, own], ["arena-wins"]).map(
                (task) => task.name,
            ),
        ).toEqual(["Arena 5v5", "PvP", "Own"])
    })

    it("leaves saves that already know Arena 1v1 as they are", () => {
        expect(renameOldPresets([arena], STARTER_IDS)[0].name).toBe("Arena")
    })
})
