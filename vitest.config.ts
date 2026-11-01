import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

// Separate from vite.config.ts so tests don't run the router generator or the
// share preview plugin. .test.ts runs in node (add a `@vitest-environment jsdom`
// comment when a file needs the browser's storage), .test.tsx in jsdom.
export default defineConfig({
    plugins: [react()],

    resolve: {
        tsconfigPaths: true,
    },

    test: {
        // Screenshot readers do real image work, and CI machines are slower.
        testTimeout: 30_000,
        coverage: {
            provider: "v8",
            include: ["src/**/*.{ts,tsx}"],
            exclude: [
                "src/**/*.test.{ts,tsx}",
                "src/routeTree.gen.ts",
                "src/test/**",
            ],
        },
        projects: [
            {
                extends: true,
                test: {
                    name: "unit",
                    environment: "node",
                    include: ["src/**/*.test.ts", "scripts/**/*.test.ts"],
                },
            },
            {
                extends: true,
                test: {
                    name: "component",
                    environment: "jsdom",
                    include: ["src/**/*.test.tsx"],
                    setupFiles: ["src/test/setupComponents.ts"],
                },
            },
        ],
    },
})
