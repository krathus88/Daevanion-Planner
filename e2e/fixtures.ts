import { expect, test as base } from "@playwright/test"

// Every test stays on the local build: nothing reaches Supabase's live database
// or the map tile host, so results don't depend on the network and tests can't
// touch real data. Any uncaught page error fails the test.
export const test = base.extend<{ pageErrors: void; instantSections: void }>({
    pageErrors: [
        async ({ page, baseURL }, use) => {
            const errors: string[] = []

            page.on("pageerror", (error) => {
                errors.push(error.message)
            })
            await page.route("**/*", (route) => {
                return route
                    .request()
                    .url()
                    .startsWith(baseURL ?? "")
                    ? route.continue()
                    : route.abort()
            })
            await page.routeWebSocket(/^wss?:\/\/(?!localhost)/, (socket) => {
                void socket.close()
            })

            await use()

            expect(errors).toEqual([])
        },
        { auto: true },
    ],
    // Sections (Chakra Collapsibles) open without their height animation. A
    // section still opening can move what's in it between mouse down and up,
    // so a click there focuses the button but doesn't count, which Firefox hit
    // now and then. No test checks that animation.
    instantSections: [
        async ({ page }, use) => {
            await page.addInitScript(() => {
                const addStyle = () => {
                    const style = document.createElement("style")

                    style.textContent =
                        ".chakra-collapsible__content { animation-name: none !important; }"
                    document.head.append(style)
                }

                if (document.head) {
                    addStyle()
                } else {
                    document.addEventListener("DOMContentLoaded", addStyle)
                }
            })

            await use()
        },
        { auto: true },
    ],
})

export { expect }
