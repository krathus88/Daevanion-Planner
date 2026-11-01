import { describe, expect, it } from "vitest"
import { CLASS_NAMES } from "../src/config/classPresets/classInfo"
import { readClasses } from "./siteMeta"

describe("readClasses", () => {
    it("reads the same classes the app has, by parsing its source", () => {
        const classes = readClasses()

        expect(
            Object.fromEntries(classes.map((item) => [item.id, item.name])),
        ).toEqual(CLASS_NAMES)
    })

    it("handles quoted ids", () => {
        expect(readClasses().map((item) => item.id)).toContain("spirit-master")
    })

    it("points each class at its emblem", () => {
        for (const item of readClasses()) {
            expect(item.emblemPath.replaceAll("\\", "/")).toContain(
                `src/assets/${item.id}/${item.id}.webp`,
            )
        }
    })
})
