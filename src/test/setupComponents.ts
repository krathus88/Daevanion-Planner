import "@testing-library/jest-dom/vitest"
import { cleanup, configure } from "@testing-library/react"
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

// jsdom applies Chakra's CSS but never runs animations, so an element waiting
// for its exit animation's animationend (a closing dialog) would stay mounted.
// With no animations, Chakra's presence logic removes it at once.
const noAnimations = document.createElement("style")
noAnimations.textContent =
    "*, *::before, *::after { animation-name: none !important; }"
document.head.append(noAnimations)

// findBy*/waitFor* give up after 1 s by default: on CI's slower runners a
// closing dialog (TrackerPage's heavy tests) sometimes took longer.
configure({ asyncUtilTimeout: 5000 })

afterEach(() => {
    cleanup()
    localStorage.clear()
})
