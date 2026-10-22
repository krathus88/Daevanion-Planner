import type { ClassId } from "./classInfo"
import type { ClassPreset } from "./types"

// Types and defineClassPreset live in ./types so class files can import them
// without a circular import through this index.
export * from "./classInfo"
export * from "./types"

// Each class's abilities are in their own chunk, fetched when the planner
// opens that class.
const classPresetLoaders = {
    templar: () => import("./classes/Templar"),
    gladiator: () => import("./classes/Gladiator"),
    assassin: () => import("./classes/Assassin"),
    ranger: () => import("./classes/Ranger"),
    sorcerer: () => import("./classes/Sorcerer"),
    "spirit-master": () => import("./classes/SpiritMaster"),
    chanter: () => import("./classes/Chanter"),
    cleric: () => import("./classes/Cleric"),
} satisfies Record<ClassId, () => Promise<{ default: ClassPreset }>>

export const loadClassPreset = async (
    classId: ClassId,
): Promise<ClassPreset> => {
    const module = await classPresetLoaders[classId]()

    return module.default
}
