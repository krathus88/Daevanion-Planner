// Site details shared by the link-preview build step (vite.config.ts) and the
// banner generator (scripts/generateOgBanners.ts). Class and board names are
// read from the source files, so adding a class needs no change here.
import { readdirSync, readFileSync } from "node:fs"
import { join } from "node:path"

export const SITE_NAME = "Daevanion Planner"
export const SITE_DESCRIPTION =
    "Plan and optimize your AION 2 Daevanion boards: pick nodes, set ability priorities, and find the cheapest routes across all four boards."

export type SiteClass = {
    id: string
    name: string
    emblemPath: string
}

const root = process.cwd()

export const readClasses = (): SiteClass[] => {
    const dir = join(root, "src/config/classPresets/classes")

    return readdirSync(dir)
        .filter((file) => file.endsWith(".ts"))
        .map((file) => {
            const source = readFileSync(join(dir, file), "utf-8")
            // The class's own id and name are the first ones in the file,
            // before the abilities list.
            const id = /\bid:\s*"([^"]+)"/.exec(source)?.[1]
            const name = /\bname:\s*"([^"]+)"/.exec(source)?.[1]
            if (!id || !name) {
                throw new Error(`Could not read the class id/name in ${file}.`)
            }

            return {
                id,
                name,
                emblemPath: join(root, "src/assets", id, `${id}.webp`),
            }
        })
}

export const readBoardNames = (): string[] => {
    const source = readFileSync(
        join(root, "src/features/planner/config/layouts.ts"),
        "utf-8",
    )
    const union = /export type LayoutType\s*=\s*([^\n]+)/.exec(source)?.[1]
    const names = [...(union ?? "").matchAll(/"([^"]+)"/g)].map(
        (match) => match[1],
    )
    if (names.length === 0) {
        throw new Error("Could not read the board names from layouts.ts.")
    }

    return names
}

export const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1)
