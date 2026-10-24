// Re-run after adding a class: npm run og:banners
import { mkdirSync } from "node:fs"
import { join } from "node:path"
import sharp, { type OverlayOptions } from "sharp"
import { readClasses, SITE_NAME, type SiteClass } from "./siteMeta.ts"

const WIDTH = 1200
const HEIGHT = 630
const EMBLEM_SIZE = 340
const outDir = join(process.cwd(), "public/og")

const escapeXml = (value: string) =>
    value.replace(/[&<>"]/g, (char) => `&#${char.charCodeAt(0)};`)

const background = (title: string, hasEmblem: boolean) => {
    const textX = hasEmblem ? 520 : WIDTH / 2
    const anchor = hasEmblem ? "start" : "middle"

    return Buffer.from(`
<svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
    <defs>
        <radialGradient id="bg" cx="${hasEmblem ? "25%" : "50%"}" cy="50%" r="80%">
            <stop offset="0%" stop-color="#1c2230"/>
            <stop offset="60%" stop-color="#0e1117"/>
            <stop offset="100%" stop-color="#0a0c11"/>
        </radialGradient>
        <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#e0ad4c" stop-opacity="0.32"/>
            <stop offset="100%" stop-color="#e0ad4c" stop-opacity="0"/>
        </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    ${hasEmblem ? `<circle cx="260" cy="${HEIGHT / 2}" r="260" fill="url(#glow)"/>` : ""}
    <rect x="0" y="${HEIGHT - 8}" width="${WIDTH}" height="8" fill="#e0ad4c"/>
    <g font-family="Segoe UI, Helvetica, Arial, sans-serif" text-anchor="${anchor}">
        <text x="${textX}" y="250" fill="#e0ad4c" font-size="34" font-weight="700" letter-spacing="6">${escapeXml(SITE_NAME.toUpperCase())}</text>
        <text x="${textX}" y="350" fill="#e9ebf1" font-size="${title.length > 12 ? 84 : 96}" font-weight="700">${escapeXml(title)}</text>
        <text x="${textX}" y="420" fill="#9ba3b4" font-size="32">AION 2 board planner &amp; optimizer</text>
    </g>
</svg>`)
}

const render = async (
    fileName: string,
    title: string,
    siteClass?: SiteClass,
) => {
    const layers: OverlayOptions[] = []
    if (siteClass) {
        const emblem = await sharp(siteClass.emblemPath)
            .resize(EMBLEM_SIZE, EMBLEM_SIZE, {
                fit: "contain",
                background: { r: 0, g: 0, b: 0, alpha: 0 },
            })
            .png()
            .toBuffer()
        layers.push({
            input: emblem,
            left: 260 - EMBLEM_SIZE / 2,
            top: Math.round(HEIGHT / 2 - EMBLEM_SIZE / 2),
        })
    }

    const target = join(outDir, fileName)
    await sharp(background(title, Boolean(siteClass)))
        .composite(layers)
        .png()
        .toFile(target)
    console.log(`wrote ${target}`)
}

mkdirSync(outDir, { recursive: true })
await render("default.png", "Daevanion Boards")
for (const siteClass of readClasses()) {
    await render(`${siteClass.id}.png`, siteClass.name, siteClass)
}
