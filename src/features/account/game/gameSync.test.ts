// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest"
import { readCraftingSettings } from "@crafting/storage/craftingSettings"
import { readPetCollection } from "@pets/storage/petCollection"
import { readTrackerData } from "@tracker/storage/trackerData"
import {
    applyGameSnapshots,
    readGameBoards,
    reapplyGameSnapshot,
    readGameCharacters,
    readGameSections,
    readGameSnapshots,
} from "./gameSync"

const KEY = "daevanion:game:v1:1301:Testchar"

const store = (value: object, key = KEY) => {
    window.localStorage.setItem(key, JSON.stringify(value))
}

const snapshot = (at: number, energy: number) => {
    return {
        v: 1,
        character: { name: "Testchar", server: 1301, class: 30 },
        counters: { "60000001": [energy, 0] },
        countersAt: at,
        pets: { "1192": [2, 49] },
        petsAt: at,
        items: { "1": { "610530001": 7 } },
        itemsAt: at,
    }
}

const energyOf = () => {
    const data = readTrackerData()

    return data.energy[data.characters[0].id]?.base
}

// The tracker already has the snapshots' character (new ones wait for the
// user, see getNewGameCharacters).
const TRACKER = JSON.stringify({
    characters: [
        { id: "t", name: "Testchar", classId: "cleric", server: "siel" },
    ],
})

describe("applyGameSnapshots", () => {
    beforeEach(() => {
        window.localStorage.clear()
        window.localStorage.setItem("daevanion:tracker:v1:data", TRACKER)
    })

    it("fills a character added later from its snapshot", () => {
        window.localStorage.setItem("daevanion:tracker:v1:data", "{}")
        store(snapshot(Date.UTC(2026, 10, 11), 15))
        applyGameSnapshots()

        expect(readTrackerData().characters).toEqual([])

        window.localStorage.setItem("daevanion:tracker:v1:data", TRACKER)
        reapplyGameSnapshot("1301:Testchar")

        expect(energyOf()).toBe(15)
    })

    it("fills the tracker, pets and crafting from a new snapshot", () => {
        store(snapshot(Date.UTC(2026, 10, 11), 15))

        applyGameSnapshots()

        const data = readTrackerData()

        expect(data.characters).toMatchObject([
            { name: "Testchar", classId: "cleric", server: "siel" },
        ])
        expect(energyOf()).toBe(15)
        expect(readPetCollection().souls["1192"]).toBe(79)
        expect(readCraftingSettings().owned).toEqual({ "610530001": 7 })
    })

    it("applies each snapshot once, so later edits stay", () => {
        store(snapshot(Date.UTC(2026, 10, 11), 15))
        applyGameSnapshots()

        const raw = window.localStorage.getItem("daevanion:tracker:v1:data")

        applyGameSnapshots()

        expect(window.localStorage.getItem("daevanion:tracker:v1:data")).toBe(
            raw,
        )
    })

    it("applies a newer snapshot of the same character", () => {
        store(snapshot(Date.UTC(2026, 10, 11), 15))
        applyGameSnapshots()
        store(snapshot(Date.UTC(2026, 10, 11, 0, 30), 30))
        applyGameSnapshots()

        expect(energyOf()).toBe(30)
    })

    it("applies everything once more after the version changes", () => {
        const at = Date.UTC(2026, 10, 11)

        store(snapshot(at, 15))
        window.localStorage.setItem(
            "daevanion:game-applied",
            JSON.stringify({ "daevanion:game:v1:1301:Testchar": at }),
        )
        applyGameSnapshots()

        expect(energyOf()).toBe(15)
        expect(window.localStorage.getItem("daevanion:game-applied")).toBeNull()
    })

    it("lists the characters with their class", () => {
        store(snapshot(1, 1), "daevanion:game:v1:1302:Zed")
        store(snapshot(1, 1))
        window.localStorage.setItem("daevanion:tracker:v1:data", "{}")

        expect(readGameCharacters()).toBe("1301:30:Testchar\n1302:30:Zed")
        expect(readGameSnapshots()).toHaveLength(2)
    })

    it("orders characters by name, not class", () => {
        store(
            {
                ...snapshot(1, 1),
                character: { name: "Alpha", server: 1301, class: 30 },
            },
            "daevanion:game:v1:1301:Alpha",
        )
        store(
            {
                ...snapshot(1, 1),
                character: { name: "Beta", server: 1301, class: 6 },
            },
            "daevanion:game:v1:1301:Beta",
        )

        expect(readGameCharacters()).toBe("1301:30:Alpha\n1301:6:Beta")
    })

    it("lists the characters' boards, the same array until a snapshot changes", () => {
        store({
            ...snapshot(1, 1),
            boards: { "1": [33] },
            boardsAt: 5,
        })
        store(snapshot(1, 1), "daevanion:game:v1:1302:Zed")

        const boards = readGameBoards()

        expect(boards).toEqual([
            {
                name: "Testchar",
                server: 1301,
                class: 30,
                at: 5,
                boards: { "1": [33] },
            },
        ])
        expect(readGameBoards()).toBe(boards)

        // Only the items changed: the boards stay the same array.
        store({
            ...snapshot(1, 1),
            items: { "1": { "610530001": 8 } },
            boards: { "1": [33] },
            boardsAt: 5,
        })

        expect(readGameBoards()).toBe(boards)

        store({ ...snapshot(1, 1), boards: { "1": [33, 34] }, boardsAt: 6 })

        expect(readGameBoards()[0].boards["1"]).toEqual([33, 34])
    })

    it("leaves the tracker, pets and crafting objects alone when a snapshot changes nothing they show", () => {
        store(snapshot(Date.UTC(2026, 10, 11), 15))
        applyGameSnapshots()

        const tracker = readTrackerData()
        const pets = readPetCollection()
        const crafting = readCraftingSettings()

        // Newer, same values (and the same energy recharge period).
        store(snapshot(Date.UTC(2026, 10, 11, 0, 30), 15))
        applyGameSnapshots()

        expect(readTrackerData()).toBe(tracker)
        expect(readPetCollection()).toBe(pets)
        expect(readCraftingSettings()).toBe(crafting)
    })

    it("gives only the changed character's energy a new object", () => {
        store(snapshot(Date.UTC(2026, 10, 11), 15))
        applyGameSnapshots()

        const before = readTrackerData()

        store(snapshot(Date.UTC(2026, 10, 11, 0, 30), 30))
        applyGameSnapshots()

        const after = readTrackerData()

        expect(energyOf()).toBe(30)
        expect(after.characters).toBe(before.characters)
        expect(after.counts).toBe(before.counts)
    })

    it("lists what each snapshot holds", () => {
        store(
            {
                v: 1,
                character: { name: "Zed", server: 1302, class: 30 },
                items: { "1": {} },
                itemsAt: 1,
                crafts: { "31070002": [0, 1, 1] },
                craftsAt: 1,
                pets: {},
                petsAt: 1,
            },
            "daevanion:game:v1:1302:Zed",
        )

        expect(readGameSections()).toBe(
            "1302:Zed:crafts.31070002\n1302:Zed:items\n1302:Zed:pets",
        )
    })

    it("ignores snapshots it can't read", () => {
        store({ v: 99 })

        applyGameSnapshots()

        expect(window.localStorage.getItem("daevanion:tracker:v1:data")).toBe(
            TRACKER,
        )
    })
})
