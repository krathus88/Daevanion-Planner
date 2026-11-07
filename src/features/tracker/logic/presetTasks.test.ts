import { describe, expect, it } from "vitest"
import { STARTER_TASKS } from "@tracker/config/starterTasks"
import type { TrackerTask } from "@tracker/types"
import { addNewPresets, insertPreset, STARTER_IDS } from "./presetTasks"

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
