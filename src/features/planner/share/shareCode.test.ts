// @vitest-environment jsdom
import { Blob as NodeBlob } from "node:buffer"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import type { ClassId } from "@config/classPresets"
import {
    readSavedBoards,
    readSavedPlanners,
    writeBoardProgress,
} from "@planner/storage/boardStorage"
import {
    readAllClassSettings,
    writeClassSettings,
} from "@planner/storage/classSettings"
import {
    applySharedSettings,
    decodeSharedPlan,
    defaultSharedName,
    encodeSharedPlan,
    readSharedPlan,
    readSharedSettings,
    saveSharedPlan,
    type SharedPlan,
} from "./shareCode"

const CLASS = "gladiator" as ClassId
const OTHER_CLASS = "cleric" as ClassId
const BROKEN = "This share link is broken or incomplete. Ask for a new one."

const route = {
    name: "My route",
    targetCells: ["0,0"],
    plannedPath: ["0,0", "0,1"],
    plannedCost: 5,
    availablePoints: 40,
}

const plan: SharedPlan = {
    classId: CLASS,
    boards: {
        nezekan: {
            route: route,
            selection: { selectedCells: ["0,1"], availablePoints: 40 },
        },
        zikel: {
            route: null,
            selection: { selectedCells: ["0,0"], availablePoints: 10 },
        },
    },
    settings: { stats: { a: 1 } },
}

// Builds a link code from any payload, for links the site wouldn't make.
const encodePayload = async (payload: unknown) => {
    const bytes = new TextEncoder().encode(JSON.stringify(payload))
    const stream = new Blob([bytes])
        .stream()
        .pipeThrough(new CompressionStream("deflate-raw"))
    const compressed = new Uint8Array(await new Response(stream).arrayBuffer())

    return btoa(String.fromCharCode(...compressed))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "")
}

// jsdom's Blob has no stream(), which every browser's does.
beforeAll(() => {
    vi.stubGlobal("Blob", NodeBlob)
})

afterEach(() => {
    localStorage.clear()
})

describe("encodeSharedPlan / decodeSharedPlan", () => {
    it("round-trips a plan", async () => {
        const code = await encodeSharedPlan(plan)

        expect(await decodeSharedPlan(code, CLASS)).toEqual(plan)
    })

    it("makes a code that's safe in a URL", async () => {
        expect(await encodeSharedPlan(plan)).toMatch(/^[A-Za-z0-9_-]+$/)
    })

    it("leaves the start node out of cells", async () => {
        const code = await encodeSharedPlan({
            classId: CLASS,
            boards: {
                nezekan: {
                    route: null,
                    selection: {
                        selectedCells: ["5,5", "0,0"],
                        availablePoints: 1,
                    },
                },
            },
            settings: null,
        })
        const decoded = await decodeSharedPlan(code, CLASS)

        expect(decoded).toMatchObject({
            boards: { nezekan: { selection: { selectedCells: ["0,0"] } } },
        })
    })

    it("carries settings without boards", async () => {
        const code = await encodeSharedPlan({
            classId: CLASS,
            boards: {},
            settings: { stats: 1 },
        })

        expect(await decodeSharedPlan(code, CLASS)).toMatchObject({
            settings: { stats: 1 },
        })
    })

    it("refuses another class's link", async () => {
        const code = await encodeSharedPlan(plan)

        expect(await decodeSharedPlan(code, OTHER_CLASS)).toBe(BROKEN)
    })

    it.each(["", "not base64 at all!", "AAAA"])(
        "calls the code %j broken",
        async (code) => {
            expect(await decodeSharedPlan(code, CLASS)).toBe(BROKEN)
        },
    )

    it("calls a cut-off code broken", async () => {
        const code = await encodeSharedPlan(plan)

        expect(await decodeSharedPlan(code.slice(0, 10), CLASS)).toBe(BROKEN)
    })

    it("asks for a reload on a link from a newer version", async () => {
        const code = await encodePayload({ v: 999, c: CLASS, b: {} })

        expect(await decodeSharedPlan(code, CLASS)).toContain("newer version")
    })

    it.each([
        ["no version", { c: CLASS, b: {} }],
        ["no boards or settings", { v: 1, c: CLASS, b: {} }],
        ["bad settings", { v: 1, c: CLASS, b: {}, s: 5 }],
        ["an unknown board", { v: 1, c: CLASS, b: { azphel: { m: [[], 1] } } }],
        ["an empty board", { v: 1, c: CLASS, b: { nezekan: {} } }],
        [
            "negative points",
            { v: 1, c: CLASS, b: { nezekan: { m: [[], -1] } } },
        ],
        ["a bad route", { v: 1, c: CLASS, b: { nezekan: { r: "x" } } }],
        [
            "a cell off the board",
            { v: 1, c: CLASS, b: { nezekan: { m: [[99999], 1] } } },
        ],
        [
            "a fractional cell",
            { v: 1, c: CLASS, b: { nezekan: { m: [[1.5], 1] } } },
        ],
        [
            // 0,3 is a gap in Nezekan's grid.
            "a gap in the grid",
            { v: 1, c: CLASS, b: { nezekan: { m: [[3], 1] } } },
        ],
        [
            // 5,5 is Nezekan's start, 5 * 11 + 5.
            "the start node",
            { v: 1, c: CLASS, b: { nezekan: { m: [[60], 1] } } },
        ],
    ])("calls a link with %s broken", async (_name, payload) => {
        expect(
            await decodeSharedPlan(await encodePayload(payload), CLASS),
        ).toBe(BROKEN)
    })
})

describe("readSharedPlan", () => {
    const progress = {
        selectedCells: [],
        availablePoints: 40,
        targetCells: [],
        plannedPath: [],
        plannedCost: null,
    }

    it("is null with nothing to share", () => {
        writeBoardProgress(CLASS, "nezekan", progress)

        expect(readSharedPlan(CLASS, ["nezekan"])).toBeNull()
    })

    it("reads routes, picks and settings", () => {
        writeBoardProgress(CLASS, "nezekan", {
            ...progress,
            selectedCells: ["0,1"],
            targetCells: ["0,0"],
            plannedPath: ["0,0"],
            plannedCost: 4,
            activePlanner: { id: "a", name: "Named", source: "saved" },
        })
        writeClassSettings(CLASS, "stats", 1)

        const shared = readSharedPlan(CLASS, ["nezekan", "zikel"])

        expect(shared?.boards.nezekan?.route?.name).toBe("Named")
        expect(shared?.boards.nezekan?.selection?.selectedCells).toEqual([
            "0,1",
        ])
        expect(shared?.boards.zikel).toBeUndefined()
        expect(shared?.settings).toEqual({ stats: 1 })
    })

    it("still shares boards when the settings are unreadable", () => {
        writeBoardProgress(CLASS, "nezekan", {
            ...progress,
            selectedCells: ["0,1"],
        })
        localStorage.setItem(`daevanion:v1:${CLASS}:settings`, "{")

        expect(readSharedPlan(CLASS, ["nezekan"])?.settings).toBeNull()
    })
})

describe("readSharedSettings", () => {
    it("is null without settings", () => {
        expect(readSharedSettings(CLASS)).toBeNull()
    })

    it("wraps the settings in a plan", () => {
        writeClassSettings(CLASS, "stats", 1)

        expect(readSharedSettings(CLASS)).toEqual({
            classId: CLASS,
            boards: {},
            settings: { stats: 1 },
        })
    })
})

describe("defaultSharedName", () => {
    it("uses the first named route", () => {
        expect(defaultSharedName(plan)).toBe("My route")
    })

    it("falls back to a generic name", () => {
        expect(defaultSharedName({ ...plan, boards: {} })).toBe("Shared plan")
    })
})

describe("applySharedSettings", () => {
    it("explains a link without settings", () => {
        expect(applySharedSettings({ ...plan, settings: null })).toBe(
            "This link has no optimizer settings.",
        )
    })

    it("replaces the class's settings", () => {
        writeClassSettings(CLASS, "ariel", 9)

        expect(applySharedSettings(plan)).toBeNull()
        expect(readAllClassSettings(CLASS)).toEqual(plan.settings)
    })
})

describe("saveSharedPlan", () => {
    it("saves routes and manual boards", () => {
        const result = saveSharedPlan(plan, "Imported", false)

        expect(result).toEqual({
            summary:
                "Saved 1 route and 2 manual boards to your Gladiator plans.",
        })
        expect(readSavedPlanners(CLASS, "nezekan").value?.[0]).toMatchObject({
            name: "Imported",
            plannedCost: 5,
        })
        expect(readSavedBoards(CLASS, "zikel").value).toHaveLength(1)
        expect(readAllClassSettings(CLASS)).toEqual({})
    })

    it("replaces settings when asked", () => {
        const result = saveSharedPlan(plan, "Imported", true)

        expect(result).toMatchObject({
            summary: expect.stringContaining("Optimizer priorities replaced."),
        })
        expect(readAllClassSettings(CLASS)).toEqual(plan.settings)
    })

    it("adds nothing the second time", () => {
        saveSharedPlan(plan, "Imported", false)

        expect(saveSharedPlan(plan, "Imported", false)).toEqual({
            summary: "You already have everything in this link.",
        })
        expect(readSavedPlanners(CLASS, "nezekan").value).toHaveLength(1)
    })

    it("returns an error when saved plans can't be read", () => {
        localStorage.setItem(`daevanion:v1:${CLASS}:nezekan:saved-boards`, "{")

        expect(saveSharedPlan(plan, "Imported", false)).toMatchObject({
            error: expect.stringContaining("Could not save"),
        })
    })
})
