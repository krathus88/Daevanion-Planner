import { defineConfig, devices } from "@playwright/test"

// The VS Code extension starts Playwright without npm on PATH, so Vite runs
// through the Node that's already running this.
const vite = `"${process.execPath}" node_modules/vite/bin/vite.js`

// Runs against the production build, on its own port so a running dev server
// or `npm run preview` isn't reused by accident.
export default defineConfig({
    testDir: "e2e",
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    reporter: process.env.CI
        ? [["github"], ["html", { open: "never" }]]
        : "list",
    use: {
        baseURL: "http://localhost:4174",
        trace: "on-first-retry",
    },
    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],
    webServer: {
        command: `${vite} build && ${vite} preview --port 4174 --strictPort`,
        url: "http://localhost:4174",
        reuseExistingServer: false,
        timeout: 180_000,
    },
})
