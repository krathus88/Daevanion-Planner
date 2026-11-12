import { describe, expect, it } from "vitest"
import { getNewGameCharacters, getServerCharacters } from "./gameCharacters"

describe("getServerCharacters", () => {
    it("lists a server's characters with their class", () => {
        const lines = "1301:30:Alpha\n1301:99:Beta\n1302:6:Gamma"

        expect(getServerCharacters(lines, "siel")).toEqual([
            { name: "Alpha", classId: "cleric" },
            // A class number the site doesn't know yet.
            { name: "Beta", classId: null },
        ])
        expect(getServerCharacters(lines, "nezekan")).toEqual([
            { name: "Gamma", classId: "gladiator" },
        ])
    })

    it("keeps colons in names and skips broken lines", () => {
        expect(getServerCharacters("1301:30:A:B\nbad\n", "siel")).toEqual([
            { name: "A:B", classId: "cleric" },
        ])
        expect(getServerCharacters("", "siel")).toEqual([])
    })
})

describe("getNewGameCharacters", () => {
    const LINES = [
        "1301:30:Kryx",
        "1301:6:Krathus",
        "1301:14:Newbie",
        "1302:10:Faraway",
    ].join("\n")

    it("lists the characters the tracker lacks, with class and server", () => {
        expect(
            getNewGameCharacters(
                LINES,
                [{ name: " kryx ", server: "siel" }],
                [],
            ),
        ).toEqual([
            {
                key: "1301:Krathus",
                name: "Krathus",
                server: "siel",
                classId: "gladiator",
            },
            {
                key: "1302:Faraway",
                name: "Faraway",
                server: "nezekan",
                classId: "templar",
            },
        ])
    })

    it("leaves out declined characters and classes it can't name", () => {
        expect(
            getNewGameCharacters(
                LINES,
                [],
                ["siel:krathus", "nezekan:faraway"],
            ),
        ).toEqual([
            {
                key: "1301:Kryx",
                name: "Kryx",
                server: "siel",
                classId: "cleric",
            },
        ])
    })
})
