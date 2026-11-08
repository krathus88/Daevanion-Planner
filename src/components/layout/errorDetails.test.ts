import { describe, expect, it } from "vitest"
import { getErrorDetails, isStaleVersionError } from "./errorDetails"

describe("isStaleVersionError", () => {
    it("knows each browser's missing chunk message", () => {
        const messages = [
            "Failed to fetch dynamically imported module: https://x/a.js",
            "error loading dynamically imported module: https://x/a.js",
            "Importing a module script failed.",
        ]

        for (const message of messages) {
            expect(isStaleVersionError(new TypeError(message))).toBe(true)
        }
    })

    it("leaves other errors alone", () => {
        expect(isStaleVersionError(new Error("x is undefined"))).toBe(false)
        expect(isStaleVersionError("plain text")).toBe(false)
        expect(isStaleVersionError(null)).toBe(false)
    })
})

describe("getErrorDetails", () => {
    it("uses a stack that already starts with the message", () => {
        const error = new Error("Boom")

        error.stack = "Error: Boom\n    at Page (page.js:1:1)"

        expect(getErrorDetails(error, "/tracker")).toBe(
            "Error: Boom\n    at Page (page.js:1:1)\n\nPage: /tracker",
        )
    })

    it("adds the message to a stack without it, and the components", () => {
        const error = new TypeError("Boom")

        error.stack = "Page@page.js:1:1"

        expect(getErrorDetails(error, "/pets?pet=3", "\n    at Page\n")).toBe(
            [
                "TypeError: Boom",
                "Page@page.js:1:1",
                "Components:\n    at Page",
                "Page: /pets?pet=3",
            ].join("\n\n"),
        )
    })

    it("reads anything thrown that isn't an Error", () => {
        expect(getErrorDetails("oops", "/")).toBe("oops\n\nPage: /")
    })
})
