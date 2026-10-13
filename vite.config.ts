import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import babel from "@rolldown/plugin-babel"
import { tanstackRouter } from "@tanstack/router-plugin/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"
import {
    capitalize,
    readBoardNames,
    readClasses,
    SITE_DESCRIPTION,
    SITE_NAME,
} from "./scripts/siteMeta.ts"

// Link previews (Discord, Slack, X...) read Open Graph tags from the raw HTML
// and don't run JavaScript. This adds the tags to index.html and, after a
// build, writes <class>/<board>.html for every class and board with its own
// title and banner. GitHub Pages serves /<class>/<board> from those files.
const sharePreviews = (): Plugin => {
    const start = "<!-- share-preview -->"
    const end = "<!-- /share-preview -->"
    let base = "/"
    let outDir = "dist"

    const escapeHtml = (value: string) =>
        value.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`)

    // Previews need absolute URLs; the deploy workflow sets SITE_URL.
    const absolute = (path: string) => {
        const siteUrl = process.env.SITE_URL
        return siteUrl ? new URL(path, siteUrl).href : `${base}${path}`
    }

    const tags = (title: string, image: string, path: string) =>
        [
            start,
            `<title>${escapeHtml(title)}</title>`,
            `<meta name="description" content="${escapeHtml(SITE_DESCRIPTION)}" />`,
            `<meta property="og:type" content="website" />`,
            `<meta property="og:site_name" content="${SITE_NAME}" />`,
            `<meta property="og:title" content="${escapeHtml(title)}" />`,
            `<meta property="og:description" content="${escapeHtml(SITE_DESCRIPTION)}" />`,
            `<meta property="og:image" content="${absolute(image)}" />`,
            `<meta property="og:image:width" content="1200" />`,
            `<meta property="og:image:height" content="630" />`,
            `<meta property="og:url" content="${absolute(path)}" />`,
            `<meta name="twitter:card" content="summary_large_image" />`,
            `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
            `<meta name="twitter:description" content="${escapeHtml(SITE_DESCRIPTION)}" />`,
            `<meta name="twitter:image" content="${absolute(image)}" />`,
            end,
        ].join("\n    ")

    return {
        name: "share-previews",
        configResolved(config) {
            base = config.base
            outDir = config.build.outDir
        },
        transformIndexHtml(html) {
            return html.replace(
                /<title>[^<]*<\/title>/,
                tags(SITE_NAME, "og/default.png", ""),
            )
        },
        closeBundle() {
            const indexPath = join(outDir, "index.html")
            const html = readFileSync(indexPath, "utf-8")
            const block = html.slice(
                html.indexOf(start),
                html.indexOf(end) + end.length,
            )

            for (const siteClass of readClasses()) {
                for (const board of readBoardNames()) {
                    const path = `${siteClass.id}/${board}`
                    const page = html.replace(
                        block,
                        tags(
                            `Daevanion - ${siteClass.name} · ${capitalize(board)}`,
                            `og/${siteClass.id}.png`,
                            path,
                        ),
                    )
                    const target = join(outDir, `${path}.html`)
                    mkdirSync(dirname(target), { recursive: true })
                    writeFileSync(target, page)
                }
            }
        },
    }
}

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
        sharePreviews(),
    ],

    resolve: {
        tsconfigPaths: true,
    },
})
