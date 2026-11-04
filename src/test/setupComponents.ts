import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

// jsdom has no matchMedia, which Chakra's breakpoint hooks need. No query
// matches, so components render their phone (base) layout.
if (typeof window.matchMedia !== "function") {
    Object.defineProperty(window, "matchMedia", {
        value: (query: string) => {
            return {
                matches: false,
                media: query,
                onchange: null,
                addListener: () => {},
                removeListener: () => {},
                addEventListener: () => {},
                removeEventListener: () => {},
                dispatchEvent: () => false,
            }
        },
    })
}

afterEach(() => {
    cleanup()
    localStorage.clear()
})
