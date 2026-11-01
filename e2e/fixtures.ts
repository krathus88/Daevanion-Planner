import { expect, test as base } from "@playwright/test"

// Every test stays on the local build: nothing reaches Supabase's live database
// or the map tile host, so results don't depend on the network and tests can't
// touch real data. Any uncaught page error fails the test.
export const test = base.extend<{ pageErrors: void }>({
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
})

export { expect }
