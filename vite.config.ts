import babel from "@rolldown/plugin-babel"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
    // GitHub Pages serves the app from /<repo>/; the deploy workflow sets
    // BASE_PATH. Local dev and builds stay at the site root.
    base: process.env.BASE_PATH ?? "/",
    plugins: [
        tanstackRouter({
            target: "react",
            autoCodeSplitting: true,
        }),
        react(),
        babel({
            presets: [reactCompilerPreset()],
        }),
    ],

    resolve: {
        tsconfigPaths: true,
    },
})
