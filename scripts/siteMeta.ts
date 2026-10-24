// Class names come from classInfo.ts, so adding a class needs no change here.
import { readFileSync } from "node:fs"
import { join } from "node:path"

export const SITE_NAME = "Daevanion Planner"
export const SITE_DESCRIPTION =
    "Plan and optimize your AION 2 Daevanion boards: pick nodes, set ability priorities, and find the cheapest routes across all four boards."

export const TIMERS_DESCRIPTION =
    "AION 2 timers for EU servers: Eternal Gartua, Spacetime Rift, Shugo Festival, and the daily and weekly resets, in your local time."

export type SiteClass = {
    id: string
    name: string
    emblemPath: string
}

const root = process.cwd()

export const readClasses = (): SiteClass[] => {
    const source = readFileSync(
        join(root, "src/config/classPresets/classInfo.ts"),
        "utf-8",
    )
    // One `id: "Name",` line per class in CLASS_NAMES.
    const block = /CLASS_NAMES = \{([^}]*)\}/.exec(source)?.[1] ?? ""
    const classes = [...block.matchAll(/^\s*"?([\w-]+)"?:\s*"([^"]+)",?$/gm)]
    if (classes.length === 0) {
        throw new Error("Could not read CLASS_NAMES in classInfo.ts.")
    }

    return classes.map(([, id, name]) => ({
        id,
        name,
        emblemPath: join(root, "src/assets", id, `${id}.webp`),
    }))
}
